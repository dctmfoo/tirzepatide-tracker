import { Flame } from 'lucide-react';

type StreakCardProps = {
  streak: number;
};

export function StreakCard({ streak }: StreakCardProps) {
  const hasStreak = streak > 0;

  return (
    <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      <div className="mb-2.5 flex items-center gap-2">
        <Flame
          className={`h-5 w-5 ${hasStreak ? 'text-orange-500' : 'text-orange-400/50'}`}
        />
        <span className="font-semibold text-card-foreground">Streak</span>
      </div>
      {hasStreak ? (
        <>
          <p className="font-display text-xl font-bold text-card-foreground">
            {streak} <span className="text-[0.875rem] font-normal text-muted-foreground">days</span>
          </p>
          <p className="mt-0.5 text-[0.875rem] text-muted-foreground/70">
            Keep it up!
          </p>
        </>
      ) : (
        <p className="text-[0.875rem] leading-relaxed text-muted-foreground">
          Build momentum by logging daily
        </p>
      )}
    </div>
  );
}
