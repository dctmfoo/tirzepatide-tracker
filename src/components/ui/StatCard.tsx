import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'violet'
  | 'amber'
  | 'blue'
  | 'orange'
  | 'emerald';

type StatCardProps = {
  label: string;
  value: string | number | null;
  icon?: LucideIcon;
  iconColor?: IconColor;
  unit?: string;
  subtext?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'destructive' | 'default';
  };
  className?: string;
};

const iconColorStyles: Record<IconColor, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  violet: 'text-violet-500',
  amber: 'text-amber-500',
  blue: 'text-blue-500',
  orange: 'text-orange-500',
  emerald: 'text-emerald-500',
};

const iconBgStyles: Record<IconColor, string> = {
  primary: 'bg-primary/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  destructive: 'bg-destructive/15',
  violet: 'bg-violet-500/15',
  amber: 'bg-amber-500/15',
  blue: 'bg-blue-500/15',
  orange: 'bg-orange-500/15',
  emerald: 'bg-emerald-500/15',
};

const badgeStyles = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  default: 'bg-muted text-muted-foreground',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'primary',
  unit,
  subtext,
  badge,
  className,
}: StatCardProps) {
  const displayValue = value !== null ? value : '—';

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-[1.25rem] bg-card p-2 shadow-sm',
        className
      )}
    >
      {/* Icon container */}
      {Icon && (
        <div
          className={cn(
            'mb-1 flex h-6 w-6 items-center justify-center rounded-full',
            iconBgStyles[iconColor]
          )}
        >
          <Icon className={cn('h-3 w-3', iconColorStyles[iconColor])} />
        </div>
      )}

      {/* Value with optional unit and badge */}
      <div className="flex items-center justify-center gap-1.5">
        <p className="font-display text-base font-bold text-card-foreground">
          {displayValue}
          {unit && value !== null && (
            <span className="ml-0.5 text-[0.75rem] font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </p>
        {badge && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-[0.75rem] text-muted-foreground">{label}</p>

      {/* Subtext */}
      {subtext && (
        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}
