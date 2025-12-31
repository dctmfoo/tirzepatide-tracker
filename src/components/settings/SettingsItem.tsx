type SettingsItemProps = {
  label: string;
  sublabel?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
};

export function SettingsItem({
  label,
  sublabel,
  onClick,
  danger,
  disabled,
  rightElement,
}: SettingsItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
        onClick && !disabled ? 'hover:bg-background/50' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div>
        <p className={`font-medium ${danger ? 'text-error' : 'text-foreground'}`}>{label}</p>
        {sublabel && <p className="text-sm text-foreground-muted">{sublabel}</p>}
      </div>
      {rightElement ? (
        rightElement
      ) : onClick ? (
        <span className="text-foreground-muted">→</span>
      ) : null}
    </Component>
  );
}
