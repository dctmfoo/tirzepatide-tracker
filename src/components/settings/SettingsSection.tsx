type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
};

export function SettingsSection({ title, children, danger }: SettingsSectionProps) {
  return (
    <section className="mb-4">
      <h3
        className={`mb-3 px-1 text-[0.75rem] font-semibold uppercase tracking-wider ${
          danger ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        {title}
      </h3>
      <div
        className={`divide-y divide-border/40 overflow-hidden rounded-[1.25rem] bg-card shadow-sm ${
          danger ? 'border border-destructive/20' : ''
        }`}
      >
        {children}
      </div>
    </section>
  );
}
