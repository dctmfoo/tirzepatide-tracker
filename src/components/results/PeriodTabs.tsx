'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Period = '1m' | '3m' | '6m' | 'all';

type PeriodTabsProps = {
  selected: Period;
  onChange: (period: Period) => void;
};

const periods: { value: Period; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: 'all', label: 'All' },
];

export function PeriodTabs({ selected, onChange }: PeriodTabsProps) {
  return (
    <Tabs
      value={selected}
      onValueChange={(value) => onChange(value as Period)}
    >
      <TabsList className="h-8 gap-0.5 rounded-lg bg-card p-0.5">
        {periods.map((period) => (
          <TabsTrigger
            key={period.value}
            value={period.value}
            className="h-7 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            {period.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
