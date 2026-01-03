import { redirect } from 'next/navigation';

// Redirect old /calendar route to new /log route
// Full calendar view will be available at /log/calendar in Phase 5
export default function CalendarPage() {
  redirect('/log');
}
