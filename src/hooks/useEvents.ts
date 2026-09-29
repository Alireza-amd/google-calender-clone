import { useContext } from "react";
import { EventContext } from "../context/EventContext";

export function useEvents() {
  const context = useContext(EventContext);

  if (context == null) {
    throw new Error("useEvent must use in the EventContext.");
  }

  return context;
}
