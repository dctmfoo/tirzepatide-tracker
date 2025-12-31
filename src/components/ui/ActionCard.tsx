import Link from 'next/link';

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
};

export function ActionCard({ icon, title, children, action }: ActionCardProps) {
  return (
    <div className="rounded-lg bg-background-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="font-medium text-foreground">{title}</h3>
        </div>
      </div>
      <div className="mt-3">{children}</div>
      {action && (
        <div className="mt-4">
          <Link
            href={action.href}
            className="inline-block rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
