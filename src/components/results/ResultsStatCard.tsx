import type { LucideIcon } from 'lucide-react';

type ResultsStatCardProps = {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: string | number | null;
  unit?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'destructive' | 'default';
  };
  subtext?: string;
};

const badgeStyles = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  default: 'bg-muted text-muted-foreground',
};

const iconColorStyles: Record<string, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  violet: 'text-violet-500',
  amber: 'text-amber-500',
  emerald: 'text-emerald-500',
  blue: 'text-blue-500',
};

export function ResultsStatCard({
  icon: Icon,
  iconColor = 'primary',
  label,
  value,
  unit,
  badge,
  subtext,
}: ResultsStatCardProps) {
  const displayValue = value !== null ? value : '—';
  const iconBgColor = iconColor === 'primary' ? 'bg-primary/10' :
    iconColor === 'success' ? 'bg-success/10' :
    iconColor === 'warning' ? 'bg-warning/10' :
    iconColor === 'destructive' ? 'bg-destructive/10' :
    iconColor === 'violet' ? 'bg-violet-500/10' :
    iconColor === 'amber' ? 'bg-amber-500/10' :
    iconColor === 'emerald' ? 'bg-emerald-500/10' :
    iconColor === 'blue' ? 'bg-blue-500/10' :
    'bg-primary/10';

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-3">
      {/* Decorative circle */}
      <div className={`absolute -right-2 -top-2 h-10 w-10 rounded-full ${iconBgColor}`} />

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

        {badge && (
          <span
            className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badgeStyles[badge.variant]}`}
          >
            {badge.text}
          </span>
        )}

        {subtext && <p className="mt-0.5 text-[10px] text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}
