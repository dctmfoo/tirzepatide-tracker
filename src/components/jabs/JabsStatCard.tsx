'use client';

import type { LucideIcon } from 'lucide-react';

type IconColor = 'violet' | 'amber' | 'blue';

type Props = {
  icon: LucideIcon;
  iconColor: IconColor;
  value: number | string;
  unit?: string;
  label: string;
};

const iconColorClasses: Record<IconColor, { bg: string; text: string }> = {
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-500' },
};

export function JabsStatCard({ icon: Icon, iconColor, value, unit, label }: Props) {
  const colors = iconColorClasses[iconColor];

  return (
    <div className="flex flex-col items-center rounded-[1.25rem] bg-card p-3 shadow-sm">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${colors.bg}`}>
        <Icon className={`h-4 w-4 ${colors.text}`} />
      </div>
      <p className="font-display text-lg font-bold text-card-foreground">
        {value}
        {unit && (
          <span className="ml-0.5 text-[0.75rem] font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      <p className="text-[0.75rem] text-muted-foreground">{label}</p>
    </div>
  );
}
