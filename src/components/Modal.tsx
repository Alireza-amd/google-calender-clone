import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cc } from "../utils/cc";

export type ModalProps = {
  onClose: () => void;
  isOpen: boolean;
  children: ReactNode;
};
export function Modal({ children, isOpen, onClose }: ModalProps) {
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const prevIsClosing = useRef<boolean>(null);

  useEffect(() => {
    function handleType(e: KeyboardEvent) {
      if (e.key == "Escape") onClose();
    }

    window.addEventListener("keydown", handleType);

    return () => {
      window.removeEventListener("keydown", handleType);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (!isOpen && prevIsClosing.current) {
      setIsClosing(true);
    }
    prevIsClosing.current = isOpen;
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div
      onAnimationEnd={() => setIsClosing(false)}
      className={cc("modal", isClosing && "closing")}
    >
      <div className="overlay" onClick={onClose}></div>
      <div className="modal-body">{children}</div>
    </div>,
    document.querySelector("#modal-container") as HTMLDivElement,
  );
}
