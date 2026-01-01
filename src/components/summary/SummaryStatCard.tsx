import type { LucideIcon } from 'lucide-react';

type SummaryStatCardProps = {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: string | number | null;
  unit?: string;
  subtext?: string;
};

const iconColorStyles: Record<string, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  violet: 'text-violet-500',
  amber: 'text-amber-500',
  orange: 'text-orange-500',
  blue: 'text-blue-500',
};

const iconBgStyles: Record<string, string> = {
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  destructive: 'bg-destructive/10',
  violet: 'bg-violet-500/10',
  amber: 'bg-amber-500/10',
  orange: 'bg-orange-500/10',
  blue: 'bg-blue-500/10',
};

export function SummaryStatCard({
  icon: Icon,
  iconColor = 'primary',
  label,
  value,
  unit,
  subtext,
}: SummaryStatCardProps) {
  const displayValue = value !== null ? value : '—';

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-3">
      {/* Decorative circle */}
      <div className={`absolute -right-2 -top-2 h-10 w-10 rounded-full ${iconBgStyles[iconColor] || 'bg-primary/10'}`} />

      <div className="relative">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${iconColorStyles[iconColor] || 'text-primary'}`} />
          <span>{label}</span>
        </div>

        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
          {displayValue}
          {unit && value !== null && (
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>
          )}
        </p>

        {subtext && <p className="mt-0.5 text-[10px] text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}
