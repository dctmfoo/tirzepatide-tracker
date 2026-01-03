'use client';

import { useId } from 'react';
import { Check, Flame } from 'lucide-react';

type LogHeroCardProps = {
  formattedDate: string;
  progress: {
    weight: boolean;
    mood: boolean;
    diet: boolean;
    activity: boolean;
  };
  completed: number;
  total: number;
  streak: number;
};

function ProgressRingFraction({
  completed,
  total,
  size = 64,
  strokeWidth = 6,
}: {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const id = useId();
  const gradientId = `progress-gradient-${id}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute font-display text-lg font-bold">
        {completed}/{total}
      </span>
    </div>
  );
}

export function LogHeroCard({
  formattedDate,
  progress,
  completed,
  total,
  streak,
}: LogHeroCardProps) {
  const completedItems = [
    { key: 'weight', label: 'Weight', done: progress.weight },
    { key: 'mood', label: 'Mood', done: progress.mood },
    { key: 'diet', label: 'Diet', done: progress.diet },
    { key: 'activity', label: 'Activity', done: progress.activity },
  ];

  const doneItems = completedItems.filter((item) => item.done);
  const pendingItems = completedItems.filter((item) => !item.done);

  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">{formattedDate}</h2>
        <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
          Today&apos;s check-in
        </p>
      </div>

      {/* Status Card */}
      <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <ProgressRingFraction
            completed={completed}
            total={total}
            size={64}
            strokeWidth={6}
          />

          {/* Status Info */}
          <div className="flex-1">
            {/* Completed badges */}
            {doneItems.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {doneItems.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[0.6875rem] font-medium text-success"
                  >
                    <Check className="h-3 w-3" />
                    {item.label}
                  </span>
                ))}
              </div>
            )}

            {/* Remaining text */}
            {pendingItems.length > 0 ? (
              <p className="text-[0.75rem] text-muted-foreground">
                {pendingItems.map((item) => item.label).join(' & ')} remaining
              </p>
            ) : (
              <p className="text-[0.75rem] font-medium text-success">
                All done for today!
              </p>
            )}
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-border/40 pt-3">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-[0.875rem] font-semibold">
              {streak} day streak!
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
