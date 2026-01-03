'use client';

import Link from 'next/link';
import type { DayData } from '@/lib/data/log-hub';

type WeekStripProps = {
  weekDays: DayData[];
  todayDate: string;
};

function DayCell({
  dayData,
  isToday,
}: {
  dayData: DayData;
  isToday: boolean;
}) {
  const date = new Date(dayData.date + 'T12:00:00');
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const isFuture = new Date(dayData.date) > new Date();

  const hasDots =
    dayData.hasWeight || dayData.hasCheckin || dayData.hasInjection;

  return (
    <Link
      href={isFuture ? '#' : `/log/${dayData.date}`}
      className={`flex flex-col items-center gap-1 px-2 ${
        isFuture ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <span
        className={`text-[0.6875rem] ${
          isToday ? 'font-semibold' : 'text-muted-foreground'
        }`}
      >
        {dayName}
      </span>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          isToday
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
            : isFuture
              ? 'bg-secondary/50 text-muted-foreground/50'
              : 'bg-secondary text-muted-foreground'
        }`}
      >
        <span
          className={`text-[0.875rem] ${isToday ? 'font-bold' : 'font-medium'}`}
        >
          {dayNumber}
        </span>
      </div>
      {/* Activity dots */}
      <div className="flex h-2 gap-0.5">
        {hasDots ? (
          <>
            {dayData.hasWeight && (
              <span className="h-1 w-1 rounded-full bg-blue-500" />
            )}
            {dayData.hasCheckin && (
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
            )}
            {dayData.hasInjection && (
              <span className="h-1 w-1 rounded-full bg-violet-500" />
            )}
          </>
        ) : (
          <span className="h-1 w-1" /> // Placeholder for alignment
        )}
      </div>
    </Link>
  );
}

export function WeekStrip({ weekDays, todayDate }: WeekStripProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          This Week
        </h3>
        <Link
          href="/log/calendar"
          className="text-[0.75rem] font-medium text-primary hover:underline"
        >
          Full Calendar
        </Link>
      </div>

      <div className="rounded-[1.25rem] bg-card p-3 shadow-sm">
        {/* Days row */}
        <div className="flex justify-between">
          {weekDays.map((day) => (
            <DayCell
              key={day.date}
              dayData={day}
              isToday={day.date === todayDate}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-blue-500" />
            <span className="text-[0.6875rem] text-muted-foreground">
              Weight
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            <span className="text-[0.6875rem] text-muted-foreground">
              Check-in
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-violet-500" />
            <span className="text-[0.6875rem] text-muted-foreground">
              Injection
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
