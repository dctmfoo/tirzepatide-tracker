'use client';

type CalendarDay = {
  date: string;
  hasWeight: boolean;
  hasInjection: boolean;
  hasLog: boolean;
};

type CalendarGridProps = {
  year: number;
  month: number;
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' });
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

export function CalendarGrid({
  year,
  month,
  days,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
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
    calendarCells.push(dayMap.get(dateStr) || { date: dateStr, hasWeight: false, hasInjection: false, hasLog: false });
  }

  return (
    <div className="px-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={onPrevMonth}
          className="rounded-lg p-2 text-foreground-muted hover:bg-background-card hover:text-foreground"
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="min-w-[160px] text-center text-lg font-semibold text-foreground">
          {getMonthName(month)} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="rounded-lg p-2 text-foreground-muted hover:bg-background-card hover:text-foreground"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 pb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-foreground-muted">
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
          const isSelected = cell.date === selectedDate;
          const isTodayDate = isToday(cell.date);

          return (
            <button
              key={cell.date}
              onClick={() => onSelectDate(cell.date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-accent-primary text-background'
                  : isTodayDate
                    ? 'bg-background-card ring-2 ring-accent-primary text-foreground'
                    : 'text-foreground hover:bg-background-card'
              }`}
            >
              <span className={`font-medium ${isSelected ? 'text-background' : ''}`}>{dayNum}</span>

              {/* Indicators */}
              <div className="absolute bottom-1 flex items-center gap-0.5">
                {cell.hasInjection && (
                  <span className="text-[8px]" title="Injection">💉</span>
                )}
                {cell.hasWeight && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-background' : 'bg-accent-primary'}`}
                    title="Weight logged"
                  />
                )}
                {cell.hasLog && (
                  <span
                    className={`h-1 w-1 rounded-full ${isSelected ? 'bg-background/70' : 'bg-foreground-muted'}`}
                    title="Daily log"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-foreground-muted">
        <div className="flex items-center gap-1">
          <span>💉</span>
          <span>Injection</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent-primary" />
          <span>Weight</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground-muted" />
          <span>Log</span>
        </div>
      </div>
    </div>
  );
}
