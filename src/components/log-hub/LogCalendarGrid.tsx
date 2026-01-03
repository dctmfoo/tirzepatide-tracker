'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarDay = {
  date: string;
  hasWeight: boolean;
  hasInjection: boolean;
  hasLog: boolean;
};

type LogCalendarGridProps = {
  year: number;
  month: number;
  days: CalendarDay[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading?: boolean;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
}

function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T12:00:00');
  return date > today;
}

export function LogCalendarGrid({
  year,
  month,
  days,
  onPrevMonth,
  onNextMonth,
  loading = false,
}: LogCalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Create a map for quick lookup
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Generate calendar grid cells
  const calendarCells: (CalendarDay | null)[] = [];

  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }

  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push(
      dayMap.get(dateStr) || {
        date: dateStr,
        hasWeight: false,
        hasInjection: false,
        hasLog: false,
      }
    );
  }

  return (
    <div
      className={`rounded-[1.25rem] bg-card p-4 shadow-sm ${loading ? 'pointer-events-none opacity-50' : ''}`}
    >
      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {getMonthName(month)} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[0.6875rem] font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayNum = parseInt(cell.date.split('-')[2]);
          const isTodayDate = isToday(cell.date);
          const isFuture = isFutureDate(cell.date);
          const hasDots = cell.hasWeight || cell.hasLog || cell.hasInjection;

          const cellContent = (
            <div
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isTodayDate
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                  : isFuture
                    ? 'bg-secondary/30 text-muted-foreground/50'
                    : 'bg-secondary/50 text-foreground hover:bg-secondary'
              }`}
            >
              <span
                className={`font-medium ${isTodayDate ? 'font-bold text-primary-foreground' : ''}`}
              >
                {dayNum}
              </span>

              {/* Activity Indicators */}
              <div className="absolute bottom-1 flex items-center gap-0.5">
                {hasDots ? (
                  <>
                    {cell.hasWeight && (
                      <span
                        className={`h-1 w-1 rounded-full ${isTodayDate ? 'bg-white/90' : 'bg-blue-500'}`}
                        title="Weight logged"
                      />
                    )}
                    {cell.hasLog && (
                      <span
                        className={`h-1 w-1 rounded-full ${isTodayDate ? 'bg-white/90' : 'bg-emerald-500'}`}
                        title="Check-in logged"
                      />
                    )}
                    {cell.hasInjection && (
                      <span
                        className={`h-1 w-1 rounded-full ${isTodayDate ? 'bg-white/90' : 'bg-violet-500'}`}
                        title="Injection logged"
                      />
                    )}
                  </>
                ) : null}
              </div>
            </div>
          );

          if (isFuture) {
            return (
              <div key={cell.date} className="cursor-not-allowed">
                {cellContent}
              </div>
            );
          }

          return (
            <Link
              key={cell.date}
              href={`/log/${cell.date}`}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {cellContent}
            </Link>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 border-t border-border/40 pt-3">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-[0.6875rem] text-muted-foreground">Weight</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[0.6875rem] text-muted-foreground">
            Check-in
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-[0.6875rem] text-muted-foreground">
            Injection
          </span>
        </div>
      </div>
    </div>
  );
}
