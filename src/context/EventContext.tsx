import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UnionOmit } from "../utils/types";

const LOCALSTORAGE_EVENTS_KEY = "LOCALSTORAGE_EVENTS";
export const EVENT_COLORS = ["red", "green", "blue"] as const;

export type TEvent = {
  id: string;
  name: string;
  color: (typeof EVENT_COLORS)[number];
  date: Date;
} & (
  | { allDay: false; startTime: string; endTime: string }
  | { allDay: true; startTime?: never; endTime?: never }
);
type TEventContext = {
  events: TEvent[];
  addEvent: (event: UnionOmit<TEvent, "id">) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, event: UnionOmit<TEvent, "id">) => void;
};

export const EventContext = createContext<TEventContext | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useLocalStorage(LOCALSTORAGE_EVENTS_KEY, []);

  const addEvent = useCallback(
    (event: UnionOmit<TEvent, "id">) => {
      setEvents((currentEvents) => [
        ...currentEvents,
        { id: crypto.randomUUID(), ...event },
      ]);
    },
    [setEvents],
  );
  const removeEvent = useCallback(
    (id: string) => {
      setEvents((currentEvents) =>
        currentEvents.filter((cEvent) => cEvent.id !== id),
      );
    },
    [setEvents],
  );
  const updateEvent = useCallback(
    (id: string, event: UnionOmit<TEvent, "id">) => {
      setEvents((currentEvents) =>
        currentEvents.map((cEvent) => {
          if (cEvent.id === id) {
            return { id, ...event };
          }
          return cEvent;
        }),
      );
    },
    [setEvents],
  );

  return (
    <EventContext.Provider
      value={{ events, addEvent, removeEvent, updateEvent }}
    >
      {children}
    </EventContext.Provider>
  );
}

function useLocalStorage(key: string, initialValue: TEvent[]) {
  const [value, setValue] = useState(() => {
    const jsonValue = localStorage.getItem(key);
    if (jsonValue == null) return initialValue;

    return (JSON.parse(jsonValue) as TEvent[]).map((event) => {
      if (event.date instanceof Date) return event;
      return { ...event, date: new Date(event.date) };
    });
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
