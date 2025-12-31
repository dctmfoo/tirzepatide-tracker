type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'secondary';
};

const colorClasses = {
  primary: 'bg-accent-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  secondary: 'bg-accent-secondary',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'primary',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="space-y-1">
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs text-foreground-muted">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage.toFixed(1)}%</span>}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-foreground-muted/20">
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
