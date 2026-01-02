'use client';

import Link from 'next/link';
import { ClipboardList, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TodaysLogCardProps = {
  hasLog: boolean;
  hasDiet?: boolean;
  hasActivity?: boolean;
  hasMental?: boolean;
  sideEffectsCount?: number;
};

export function TodaysLogCard({
  hasLog,
  hasDiet,
  hasActivity,
  hasMental,
  sideEffectsCount = 0,
}: TodaysLogCardProps) {
  const completedItems = [hasDiet, hasActivity, hasMental].filter(Boolean).length;
  const items = [
    { done: hasDiet, label: 'Diet' },
    { done: hasActivity, label: 'Activity' },
    { done: hasMental, label: 'Mental' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
            <ClipboardList className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Today&apos;s Log</h3>
            <p className="text-sm text-muted-foreground">
              {hasLog ? (
                <>
                  {completedItems}/3 complete
                  {sideEffectsCount > 0 && ` · ${sideEffectsCount} side effect${sideEffectsCount > 1 ? 's' : ''}`}
                </>
              ) : (
                'Not started'
              )}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${item.done ? 'bg-success' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      {hasLog && (
        <div className="mt-3 flex gap-4 text-sm">
          {items.map((item) => (
            <span
              key={item.label}
              className={`flex items-center gap-1 ${item.done ? 'text-success' : 'text-muted-foreground'}`}
            >
              {item.done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {item.label}
            </span>
          ))}
        </div>
      )}

      {!hasLog && (
        <Button variant="outline" className="mt-4 w-full" asChild>
          <Link href="/log">Log Now</Link>
        </Button>
      )}
    </div>
  );
}
