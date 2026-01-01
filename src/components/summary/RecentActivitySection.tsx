import Link from 'next/link';
import { Scale, Syringe, ClipboardList, ChevronRight } from 'lucide-react';
import { Section } from '@/components/ui';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

type ActivityItem = {
  id: string;
  type: 'weight' | 'injection' | 'log';
  date: string;
  time?: string;
  details: string;
};

type RecentActivitySectionProps = {
  activities: ActivityItem[];
};

type ActivityConfig = {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
};

const activityConfig: Record<ActivityItem['type'], ActivityConfig> = {
  weight: {
    icon: Scale,
    color: 'text-primary',
    bg: 'bg-primary/15',
    label: 'Weight',
  },
  injection: {
    icon: Syringe,
    color: 'text-violet-500',
    bg: 'bg-violet-500/15',
    label: 'Injection',
  },
  log: {
    icon: ClipboardList,
    color: 'text-blue-500',
    bg: 'bg-blue-500/15',
    label: 'Daily log',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  if (activities.length === 0) {
    return (
      <Section title="Recent Activity">
        <div className="overflow-hidden rounded-xl border border-border bg-card p-4 text-center text-muted-foreground">
          <p>No activity yet</p>
          <p className="mt-1 text-sm">Start logging to see your history</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Recent Activity">
      <div className="space-y-2">
        {activities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-3"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {config.label}: {activity.details}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.date)}
                  {activity.time && ` at ${formatTime(activity.date)}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Button variant="ghost" className="mt-3 w-full" asChild>
        <Link href="/calendar">
          View All Activity
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </Section>
  );
}
