type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
};

export function SettingsSection({ title, children, danger }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <h2
        className={`mb-2 px-4 text-xs font-semibold uppercase tracking-wider ${
          danger ? 'text-error' : 'text-foreground-muted'
        }`}
      >
        {title}
      </h2>
      <div className="divide-y divide-background-card rounded-xl bg-background-card">
        {children}
      </div>
    </div>
  );
}
