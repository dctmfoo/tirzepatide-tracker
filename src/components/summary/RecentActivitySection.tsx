import Link from 'next/link';
import { Section } from '@/components/ui';

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getActivityIcon(type: ActivityItem['type']): string {
  switch (type) {
    case 'weight':
      return '⚖️';
    case 'injection':
      return '💉';
    case 'log':
      return '📝';
    default:
      return '●';
  }
}

function getActivityLabel(type: ActivityItem['type']): string {
  switch (type) {
    case 'weight':
      return 'Weight logged';
    case 'injection':
      return 'Injection';
    case 'log':
      return 'Daily log';
    default:
      return 'Activity';
  }
}

export function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  if (activities.length === 0) {
    return (
      <Section title="Recent Activity">
        <div className="rounded-lg bg-card p-4 text-center text-muted-foreground">
          <p>No activity yet</p>
          <p className="mt-1 text-sm">Start logging to see your history</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Recent Activity">
      <div className="space-y-1">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg py-2"
          >
            <span className="mt-0.5 text-lg">{getActivityIcon(activity.type)}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {getActivityLabel(activity.type)}: {activity.details}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(activity.date)}
                {activity.time && ` ${formatTime(activity.date)}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-center">
        <Link
          href="/calendar"
          className="text-sm text-primary hover:underline"
        >
          View All Activity
        </Link>
      </div>
    </Section>
  );
}
