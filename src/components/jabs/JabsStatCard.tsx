type JabsStatCardProps = {
  label: string;
  value: string | number | null;
  sublabel?: string;
};

export function JabsStatCard({ label, value, sublabel }: JabsStatCardProps) {
  return (
    <div className="rounded-xl bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value ?? '—'}</p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
