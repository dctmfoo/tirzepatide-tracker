'use client';

import Link from 'next/link';
import { Syringe, Clock, AlertTriangle, CheckCircle2, Pill, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui';

type NextInjectionCardProps = {
  nextDue: string | null;
  daysUntil: number | null;
  currentDose: number | null;
  status: string;
  suggestedSite?: string;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getStatusText(status: string, daysUntil: number | null, nextDue: string | null): string {
  if (status === 'not_started') return 'No injections recorded';
  if (status === 'overdue') return `Overdue by ${Math.abs(daysUntil || 0)} days`;
  if (status === 'due_today') return 'Due today';
  if (status === 'due_soon') {
    const dateStr = nextDue ? ` (${formatDate(nextDue)})` : '';
    return `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}${dateStr}`;
  }
  const dateStr = nextDue ? ` (${formatDate(nextDue)})` : '';
  return `Due in ${daysUntil} days${dateStr}`;
}

function getStatusConfig(status: string) {
  if (status === 'overdue') {
    return {
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      iconBg: 'bg-destructive/15',
      cardBg: 'bg-gradient-to-br from-destructive/15 to-destructive/5',
      border: 'border-destructive/20',
    };
  }
  if (status === 'due_today' || status === 'due_soon') {
    return {
      icon: Clock,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/15',
      cardBg: 'bg-gradient-to-br from-warning/15 to-warning/5',
      border: 'border-warning/20',
    };
  }
  return {
    icon: CheckCircle2,
    iconColor: 'text-success',
    iconBg: 'bg-success/15',
    cardBg: 'bg-card',
    border: 'border-border',
  };
}

export function NextInjectionCard({
  nextDue,
  daysUntil,
  currentDose,
  status,
  suggestedSite = 'Thigh - Right',
}: NextInjectionCardProps) {
  const dayInCycle = daysUntil !== null ? Math.max(0, 7 - daysUntil) : 0;
  const progressValue = (dayInCycle / 7) * 100;
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  const showButton = status === 'not_started' || status === 'due_today' || status === 'overdue';

  return (
    <div className={`overflow-hidden rounded-xl border p-4 ${config.cardBg} ${config.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.iconBg}`}>
            <Syringe className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Next Injection</h3>
            <p className="text-sm text-muted-foreground">
              {getStatusText(status, daysUntil, nextDue)}
            </p>
          </div>
        </div>

        {status !== 'not_started' && (
          <ProgressRing value={progressValue} size={48} strokeWidth={4} />
        )}
      </div>

      {status !== 'not_started' && (
        <div className="mt-3 flex gap-4 text-sm">
          {currentDose && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Pill className="h-3.5 w-3.5" />
              {currentDose}mg
            </span>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {suggestedSite}
          </span>
        </div>
      )}

      {showButton && (
        <Button className="mt-4 w-full" asChild>
          <Link href="/jabs/new">Log Injection</Link>
        </Button>
      )}
    </div>
  );
}
