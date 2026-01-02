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
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  destructive: 'bg-destructive/10',
  violet: 'bg-violet-500/10',
  amber: 'bg-amber-500/10',
  blue: 'bg-blue-500/10',
  orange: 'bg-orange-500/10',
  emerald: 'bg-emerald-500/10',
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
  const hasIcon = !!Icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-card p-3',
        className
      )}
    >
      {/* Decorative circle - only shown when icon is provided */}
      {hasIcon && (
        <div
          className={cn(
            'absolute -right-2 -top-2 h-10 w-10 rounded-full',
            iconBgStyles[iconColor]
          )}
        />
      )}

      <div className="relative">
        {/* Icon and label row */}
        {hasIcon ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className={cn('h-3.5 w-3.5', iconColorStyles[iconColor])} />
            <span>{label}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{label}</p>
        )}

        {/* Value with optional unit */}
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
          {displayValue}
          {unit && value !== null && (
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </p>

        {/* Badge */}
        {badge && (
          <span
            className={cn(
              'mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        )}

        {/* Subtext */}
        {subtext && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}
