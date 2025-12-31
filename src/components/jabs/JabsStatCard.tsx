type JabsStatCardProps = {
  label: string;
  value: string | number | null;
  sublabel?: string;
};

export function JabsStatCard({ label, value, sublabel }: JabsStatCardProps) {
  return (
    <div className="rounded-xl bg-background-card p-4">
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value ?? '—'}</p>
      {sublabel && <p className="mt-1 text-xs text-foreground-muted">{sublabel}</p>}
    </div>
  );
}
