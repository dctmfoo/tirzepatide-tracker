'use client';

import { useState, useCallback } from 'react';
import { LogCalendarGrid } from './LogCalendarGrid';
import type { CalendarData } from '@/lib/data/calendar';

type Props = {
  initialData: CalendarData;
};

export function LogCalendarClient({ initialData }: Props) {
  const [calendarData, setCalendarData] = useState<CalendarData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar data for a different month
  // Only updates state on success to avoid mismatched header/data
  const fetchCalendarData = useCallback(
    async (newYear: number, newMonth: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/calendar/${newYear}/${newMonth}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarData(data);
        } else {
          setError('Failed to load calendar data');
        }
      } catch {
        setError('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handlePrevMonth = () => {
    const newMonth = calendarData.month === 1 ? 12 : calendarData.month - 1;
    const newYear = calendarData.month === 1 ? calendarData.year - 1 : calendarData.year;
    fetchCalendarData(newYear, newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = calendarData.month === 12 ? 1 : calendarData.month + 1;
    const newYear = calendarData.month === 12 ? calendarData.year + 1 : calendarData.year;
    fetchCalendarData(newYear, newMonth);
  };

  return (
    <div className="space-y-2">
      <LogCalendarGrid
        year={calendarData.year}
        month={calendarData.month}
        days={calendarData.days}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        loading={loading}
      />
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
