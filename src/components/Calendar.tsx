import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Fragment,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { formatDate } from "../utils/formatDate";
import { cc } from "../utils/cc";
import { Modal, type ModalProps } from "./Modal";
import { EVENT_COLORS, type TEvent } from "../context/EventContext";
import type { UnionOmit } from "../utils/types";
import { useEvents } from "../hooks/useEvents";
import { OverflowContainer } from "./OverflowContainer";

export function Calendar() {
  const { events } = useEvents();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const monthDays = useMemo(() => {
    const firstWeekStart = startOfWeek(startOfMonth(selectedMonth));
    const lastWeekEnd = endOfWeek(endOfMonth(selectedMonth));
    return eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd });
  }, [selectedMonth]);

  return (
    <div className="calendar">
      <div className="header">
        <button className="btn" onClick={() => setSelectedMonth(new Date())}>
          Today
        </button>
        <div>
          <button
            className="month-change-btn"
            onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
          >
            &lt;
          </button>
          <button
            className="month-change-btn"
            onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
          >
            &gt;
          </button>
        </div>
        <span className="month-title">
          {formatDate(selectedMonth, { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="days">
        {monthDays.map((day, index) => (
          <CalendarDay
            key={day.getTime()}
            events={events.filter((event) => isSameDay(event.date, day))}
            selectedMonth={selectedMonth}
            day={day}
            showDayName={index < 7}
          />
        ))}
      </div>
    </div>
  );
}

type CalendarDayProps = {
  selectedMonth: Date;
  day: Date;
  showDayName: boolean;
  events: TEvent[];
};

function CalendarDay({
  selectedMonth,
  day,
  showDayName,
  events,
}: CalendarDayProps) {
  const { addEvent } = useEvents();
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isShowMoreEventModalOpen, setIsShowMoreEventModalOpen] =
    useState(false);
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.allDay && b.allDay) {
        return 0;
      } else if (a.allDay) {
        return -1;
      } else if (b.allDay) {
        return 1;
      } else {
        return a.startTime.localeCompare(b.startTime);
      }
    });
  }, [events]);

  return (
    <div
      className={cc(
        "day",
        !isSameMonth(day, selectedMonth) && "non-month-day",
        isBefore(endOfDay(day), new Date()) && "old-month-day",
      )}
    >
      <div className="day-header">
        {showDayName && (
          <div className="week-name">
            {formatDate(day, { weekday: "short" })}
          </div>
        )}
        <div className={cc("day-number", isToday(day) && "today")}>
          {formatDate(day, { day: "numeric" })}
        </div>
        <button
          className="add-event-btn"
          onClick={() => setIsNewEventModalOpen(true)}
        >
          +
        </button>
      </div>
      {sortedEvents.length > 0 && (
        <>
          <OverflowContainer
            items={sortedEvents}
            getKey={(event) => event.id}
            className="events"
            renderItem={(event) => <CalendarEvent event={event} />}
            renderOverflow={(amount) => (
              <button
                onClick={() => setIsShowMoreEventModalOpen(true)}
                className="events-view-more-btn"
              >
                +{amount} More events.
              </button>
            )}
          />
          <ShowMoreEventsModal
            events={sortedEvents}
            isOpen={isShowMoreEventModalOpen}
            onClose={() => setIsShowMoreEventModalOpen(false)}
          />
        </>
      )}
      <EventFormModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        date={day}
        onSubmit={addEvent}
      />
    </div>
  );
}

type ShowMoreEventsModalProps = { events: TEvent[] } & Omit<
  ModalProps,
  "children"
>;
function ShowMoreEventsModal({
  events,
  ...modalProps
}: ShowMoreEventsModalProps) {
  if (events.length === 0) return null;
  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <small>{formatDate(events[0].date, { dateStyle: "short" })}</small>
        <button className="close-btn" onClick={modalProps.onClose}>
          &times;
        </button>
      </div>
      <div className="events">
        {events.map((event) => (
          <CalendarEvent event={event} key={event.id} />
        ))}
      </div>
    </Modal>
  );
}

function CalendarEvent({ event }: { event: TEvent }) {
  const { updateEvent, removeEvent } = useEvents();
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);

  return (
    <>
      <button
        className={cc(event.allDay && "all-day-event", "event", event.color)}
        onClick={() => setIsEditEventOpen(true)}
      >
        {event.allDay ? (
          <div className="event-name">{event.name}</div>
        ) : (
          <>
            <div className={cc("color-dot", event.color)}></div>
            <div className="event-time">
              {formatDate(parse(event.startTime, "HH:mm", event.date), {
                timeStyle: "short",
              })}
            </div>
            <div className="event-name">{event.name}</div>
          </>
        )}
      </button>
      <EventFormModal
        isOpen={isEditEventOpen}
        onClose={() => setIsEditEventOpen(false)}
        event={event}
        onSubmit={updateEvent.bind(null, event.id)}
        onDelete={removeEvent.bind(null, event.id)}
      />
    </>
  );
}

type EventFormModalProps = {
  onSubmit: (event: UnionOmit<TEvent, "id">) => void;
} & (
  | { date: Date; onDelete?: never; event?: never }
  | { date?: never; onDelete: () => void; event: TEvent }
) &
  Omit<ModalProps, "children">;

function EventFormModal({
  onSubmit,
  event,
  date,
  onDelete,
  ...modalProps
}: EventFormModalProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const [isAllDayChecked, setIsAllDayChecked] = useState(
    event?.allDay ?? false,
  );
  const [selectedColor, setSelectedColor] = useState<
    (typeof EVENT_COLORS)[number]
  >(event?.color ?? "red");
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const isNewEvent = event == null;
  const formId = useId();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const name = nameRef.current?.value;
    const endTime = endTimeRef.current?.value;

    if (name == null || name === "") return;

    const eventBaseData = {
      name,
      color: selectedColor,
      date: date ?? event.date,
    };
    let createdEvent: UnionOmit<TEvent, "id">;

    if (isAllDayChecked) {
      createdEvent = { ...eventBaseData, allDay: true };
    } else {
      if (
        endTime == null ||
        endTime === "" ||
        startTime == null ||
        startTime === ""
      )
        return;
      createdEvent = { ...eventBaseData, allDay: false, startTime, endTime };
    }

    onSubmit(createdEvent);
    modalProps.onClose();
  }

  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <div>{isNewEvent ? "Add" : "Update"} Event</div>
        <small>{formatDate(date || event.date, { dateStyle: "short" })}</small>
        <button className="close-btn" onClick={modalProps.onClose}>
          &times;
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`${formId}-name`}>Name</label>
          <input
            required
            type="text"
            id={`${formId}-name`}
            ref={nameRef}
            defaultValue={event?.name}
          />
        </div>
        <div className="form-group checkbox">
          <label htmlFor={`${formId}-all-day`}>All Day?</label>
          <input
            checked={isAllDayChecked}
            onChange={(e) => setIsAllDayChecked(e.target.checked)}
            type="checkbox"
            id={`${formId}-all-day`}
          />
        </div>
        <div className="row">
          <div className="form-group">
            <label htmlFor={`${formId}-start-time`}>Start Time</label>
            <input
              required={!isAllDayChecked}
              disabled={isAllDayChecked}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              id={`${formId}-start-time`}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${formId}-end-time`}>End Time</label>
            <input
              ref={endTimeRef}
              defaultValue={event?.endTime}
              required={!isAllDayChecked}
              disabled={isAllDayChecked}
              min={startTime}
              type="time"
              id={`${formId}-end-time`}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="row left">
            {EVENT_COLORS.map((color) => (
              <Fragment key={`${formId}-${color}`}>
                <input
                  type="radio"
                  name="color"
                  value={color}
                  id={`${formId}-${color}`}
                  checked={selectedColor === color}
                  className="color-radio"
                  onChange={() => setSelectedColor(color)}
                />
                <label htmlFor={`${formId}-${color}`}>
                  <span className="sr-only">{color}</span>
                </label>
              </Fragment>
            ))}
          </div>
        </div>
        <div className="row">
          <button className="btn btn-success" type="submit">
            {event ? "Edit" : "Add"}
          </button>
          {event != null && (
            <button className="btn btn-delete" type="button" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
