type StatCardProps = {
  label: string;
  value: string | number | null;
  sublabel?: string;
  variant?: 'default' | 'large';
};

export function StatCard({ label, value, sublabel, variant = 'default' }: StatCardProps) {
  return (
    <div className="rounded-lg bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`font-bold text-foreground ${variant === 'large' ? 'text-2xl' : 'text-xl'}`}
      >
        {value ?? '—'}
      </p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
