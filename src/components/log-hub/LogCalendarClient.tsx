'use client';

import { useState, useCallback } from 'react';
import { LogCalendarGrid } from './LogCalendarGrid';
import type { CalendarData } from '@/lib/data/calendar';

type Props = {
  initialData: CalendarData;
};

export function LogCalendarClient({ initialData }: Props) {
  const [year, setYear] = useState(initialData.year);
  const [month, setMonth] = useState(initialData.month);
  const [calendarData, setCalendarData] = useState<CalendarData>(initialData);
  const [loading, setLoading] = useState(false);

  // Fetch calendar data for a different month
  const fetchCalendarData = useCallback(
    async (newYear: number, newMonth: number) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/calendar/${newYear}/${newMonth}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarData(data);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handlePrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    const newYear = month === 1 ? year - 1 : year;
    setYear(newYear);
    setMonth(newMonth);
    fetchCalendarData(newYear, newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    const newYear = month === 12 ? year + 1 : year;
    setYear(newYear);
    setMonth(newMonth);
    fetchCalendarData(newYear, newMonth);
  };

  return (
    <LogCalendarGrid
      year={year}
      month={month}
      days={calendarData.days}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
      loading={loading}
    />
  );
}
