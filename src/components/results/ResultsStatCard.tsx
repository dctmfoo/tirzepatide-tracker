type ResultsStatCardProps = {
  icon: string;
  label: string;
  value: string | number | null;
  unit?: string;
};

export function ResultsStatCard({ icon, label, value, unit }: ResultsStatCardProps) {
  const displayValue = value !== null ? value : '—';

  return (
    <div className="rounded-xl bg-background-card p-4">
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <span className="text-accent-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">
        {displayValue}
        {unit && value !== null && (
          <span className="text-base font-normal text-foreground-muted">{unit}</span>
        )}
      </p>
    </div>
  );
}
