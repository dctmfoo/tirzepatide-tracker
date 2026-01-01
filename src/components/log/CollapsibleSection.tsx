'use client';

type CollapsibleSectionProps = {
  title: string;
  icon: string;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function CollapsibleSection({
  title,
  icon,
  isOpen,
  isComplete,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-background-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-foreground">{title}</span>
          {isComplete && (
            <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
              ✓
            </span>
          )}
        </div>
        <span className={`text-foreground-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className="border-t border-background-card p-4">{children}</div>}
    </div>
  );
}
