'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarGrid } from './CalendarGrid';
import { DayDetail } from './DayDetail';
import { LogWeightModal } from './LogWeightModal';
import { CalendarLogInjectionModal } from './CalendarLogInjectionModal';
import type { CalendarData, CalendarDay } from '@/lib/data/calendar';

type DayEntry = {
  type: 'injection' | 'weight' | 'log';
  time?: string;
  data: {
    doseMg?: number;
    site?: string;
    weightKg?: number;
    hungerLevel?: string;
    mood?: string;
    steps?: number;
  };
};

type Props = {
  initialData: CalendarData;
};

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function CalendarClient({ initialData }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(initialData.year);
  const [month, setMonth] = useState(initialData.month);
  const [calendarData, setCalendarData] = useState<CalendarData>(initialData);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showInjectionModal, setShowInjectionModal] = useState(false);

  // Fetch calendar data for a different month
  const fetchCalendarData = useCallback(async (newYear: number, newMonth: number) => {
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
  }, []);

  // Update day entries when a date is selected
  const updateDayEntries = useCallback(
    async (dateStr: string, data: CalendarData) => {
      const dayData = data.days.find((d: CalendarDay) => d.date === dateStr);
      if (!dayData) {
        setDayEntries([]);
        return;
      }

      const entries: DayEntry[] = [];

      if (dayData.hasInjection && dayData.injection) {
        entries.push({
          type: 'injection',
          data: {
            doseMg: dayData.injection.dose,
            site: dayData.injection.site,
          },
        });
      }

      if (dayData.hasWeight && dayData.weight) {
        entries.push({
          type: 'weight',
          data: {
            weightKg: dayData.weight,
          },
        });
      }

      if (dayData.hasLog) {
        // Fetch full log details
        try {
          const response = await fetch(`/api/daily-logs/${dateStr}`);
          if (response.ok) {
            const logData = await response.json();
            entries.push({
              type: 'log',
              data: {
                hungerLevel: logData.hungerLevel,
                mood: logData.mood,
                steps: logData.steps,
              },
            });
          }
        } catch {
          entries.push({
            type: 'log',
            data: {},
          });
        }
      }

      setDayEntries(entries);
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

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    updateDayEntries(date, calendarData);
  };

  const handleLogWeight = () => setShowWeightModal(true);
  const handleLogInjection = () => setShowInjectionModal(true);
  const handleLogDaily = () => {
    if (selectedDate) {
      router.push(`/log/${selectedDate}`);
    }
  };

  const handleModalClose = () => {
    setShowWeightModal(false);
    setShowInjectionModal(false);
  };

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
      </div>

      {/* Calendar Grid */}
      <div className={loading ? 'pointer-events-none opacity-50' : ''}>
        <CalendarGrid
          year={year}
          month={month}
          days={calendarData.days}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </div>

      {/* Day Detail */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          entries={dayEntries}
          onLogWeight={handleLogWeight}
          onLogInjection={handleLogInjection}
          onLogDaily={handleLogDaily}
        />
      )}

      {/* Modals */}
      {showWeightModal && (
        <LogWeightModal date={selectedDate} onClose={handleModalClose} />
      )}

      {showInjectionModal && (
        <CalendarLogInjectionModal date={selectedDate} onClose={handleModalClose} />
      )}
    </div>
  );
}
