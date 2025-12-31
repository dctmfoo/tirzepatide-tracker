'use client';

type Period = '1m' | '3m' | '6m' | 'all';

type PeriodTabsProps = {
  selected: Period;
  onChange: (period: Period) => void;
};

const periods: { value: Period; label: string }[] = [
  { value: '1m', label: '1 month' },
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: 'all', label: 'All Time' },
];

export function PeriodTabs({ selected, onChange }: PeriodTabsProps) {
  return (
    <div className="flex gap-4 border-b border-border px-4">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            selected === period.value
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {period.label}
          {selected === period.value && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
