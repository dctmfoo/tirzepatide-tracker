'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Tabs
      value={selected}
      onValueChange={(value) => onChange(value as Period)}
      className="w-full"
    >
      <TabsList className="h-auto w-full justify-start gap-4 rounded-none border-b border-border bg-transparent p-0 px-4">
        {periods.map((period) => (
          <TabsTrigger
            key={period.value}
            value={period.value}
            className="group relative h-auto rounded-none border-0 bg-transparent px-0 pb-3 pt-0 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            {period.label}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 bg-primary transition-transform group-data-[state=active]:scale-x-100" />
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
