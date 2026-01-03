import { ChevronRight, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type IconColor = 'violet' | 'amber' | 'blue' | 'emerald' | 'slate' | 'rose' | 'default';

type SettingsItemProps = {
  label: string;
  sublabel?: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconColor?: IconColor;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'default';
  };
  rightElement?: React.ReactNode;
};

const iconColorStyles: Record<IconColor, string> = {
  violet: 'bg-violet-100 dark:bg-violet-500/20 text-violet-500',
  amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500',
  blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-500',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500',
  slate: 'bg-slate-100 dark:bg-slate-500/20 text-slate-500',
  rose: 'bg-rose-100 dark:bg-rose-500/20 text-destructive',
  default: 'bg-secondary/70 text-muted-foreground',
};

const badgeStyles = {
  success: 'bg-success-light dark:bg-success/20 text-success',
  warning: 'bg-warning/15 text-warning',
  default: 'bg-secondary text-muted-foreground',
};

export function SettingsItem({
  label,
  sublabel,
  value,
  onClick,
  danger,
  disabled,
  icon: Icon,
  iconColor = 'default',
  badge,
  rightElement,
}: SettingsItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors ${
        onClick && !disabled ? 'hover:bg-secondary/50' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconColorStyles[iconColor]}`}
          >
            <Icon className="h-[1.125rem] w-[1.125rem]" />
          </div>
        )}
        <div>
          <span className={`font-medium ${danger ? 'text-destructive' : 'text-card-foreground'}`}>
            {label}
          </span>
          {sublabel && <p className="text-[0.75rem] text-muted-foreground">{sublabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        {badge && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${badgeStyles[badge.variant]}`}
          >
            {badge.variant === 'success' && <Check className="h-3 w-3" />}
            {badge.text}
          </span>
        )}
        {value && !badge && (
          <span className="text-[0.9375rem] text-muted-foreground">{value}</span>
        )}
        {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
      </div>
    </Component>
  );
}
