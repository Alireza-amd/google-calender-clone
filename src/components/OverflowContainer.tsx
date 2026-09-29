import {
  useLayoutEffect,
  useRef,
  useState,
  type Key,
  type ReactNode,
} from "react";

type TOverflowContainer<T> = {
  items: T[];
  renderItem: (item: T) => ReactNode;
  renderOverflow: (amount: number) => ReactNode;
  getKey: (item: T) => Key;
  className?: string;
};

export function OverflowContainer<T>({
  items,
  renderItem,
  renderOverflow,
  getKey,
  className,
}: TOverflowContainer<T>) {
  const [overflowAmount, setOverflowAmount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current == null) return;

    const observer = new ResizeObserver((entries) => {
      const containerElement = entries[0]?.target;
      if (containerElement == null) return;

      const itemElements =
        containerElement.querySelectorAll<HTMLElement>("[data-item]");
      const overflowElement =
        containerElement.querySelector<HTMLElement>("[data-overflow]");

      if (overflowElement != null) overflowElement.style.display = "none";
      itemElements.forEach((item) => item.style.removeProperty("display"));
      let amount = 0;
      for (let i = itemElements.length - 1; i >= 0; i--) {
        const itemElement = itemElements[i];
        if (containerElement.scrollHeight <= containerElement.clientHeight)
          break;

        overflowElement?.style.removeProperty("display");
        itemElement.style.display = "none";
        amount += 1;
      }
      setOverflowAmount(amount);
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [items]);

  return (
    <>
      <div className={className} ref={containerRef}>
        {items.map((item) => (
          <div key={getKey(item)} data-item>
            {renderItem(item)}
          </div>
        ))}
        <div data-overflow>{renderOverflow(overflowAmount)}</div>
      </div>
    </>
  );
}
