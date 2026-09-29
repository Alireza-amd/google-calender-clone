import { Calendar } from "./components/Calendar";
import { EventProvider } from "./context/EventContext";

export function App() {
  return (
    <EventProvider>
      <Calendar />;
    </EventProvider>
  );
}
