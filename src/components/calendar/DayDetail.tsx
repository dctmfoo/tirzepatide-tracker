'use client';

type DayEntry = {
  type: 'injection' | 'weight' | 'log';
  time?: string;
  data: {
    // Injection
    doseMg?: number;
    site?: string;
    // Weight
    weightKg?: number;
    // Daily log
    hungerLevel?: string;
    mood?: string;
    steps?: number;
  };
};

type DayDetailProps = {
  date: string;
  entries: DayEntry[];
  onLogWeight: () => void;
  onLogInjection: () => void;
  onLogDaily: () => void;
  onEditEntry?: (type: string, id?: string) => void;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (dateStr === todayStr) {
    return `${dayName}, ${monthDay} (Today)`;
  }
  return `${dayName}, ${monthDay}`;
}

function formatSite(site: string): string {
  const siteMap: Record<string, string> = {
    abdomen: 'Abdomen',
    abdomen_left: 'Abdomen - Left',
    abdomen_right: 'Abdomen - Right',
    thigh_left: 'Thigh - Left',
    thigh_right: 'Thigh - Right',
    arm_left: 'Arm - Left',
    arm_right: 'Arm - Right',
  };
  return siteMap[site] || site;
}

function formatHunger(level: string | undefined): string {
  if (!level) return '';
  const map: Record<string, string> = {
    none: 'None',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    extreme: 'Extreme',
  };
  return map[level] || level;
}

function formatMood(mood: string | undefined): string {
  if (!mood) return '';
  const map: Record<string, string> = {
    great: 'Great',
    good: 'Good',
    okay: 'Okay',
    low: 'Low',
    bad: 'Bad',
  };
  return map[mood] || mood;
}

function formatSteps(steps: number | undefined): string {
  if (!steps) return '';
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}k steps`;
  }
  return `${steps} steps`;
}

export function DayDetail({
  date,
  entries,
  onLogWeight,
  onLogInjection,
  onLogDaily,
  onEditEntry,
}: DayDetailProps) {
  const hasEntries = entries.length > 0;

  return (
    <div className="border-t border-border px-4 py-4">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">{formatDate(date)}</h3>
      </div>

      {/* Entries or Empty State */}
      {hasEntries ? (
        <div className="mt-4 space-y-3">
          {entries.map((entry, index) => (
            <div
              key={`${entry.type}-${index}`}
              className="flex items-start justify-between rounded-lg bg-card p-3"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {entry.type === 'injection' && '💉'}
                  {entry.type === 'weight' && '⚖️'}
                  {entry.type === 'log' && '📝'}
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {entry.type === 'injection' && 'Injection'}
                    {entry.type === 'weight' && 'Weight'}
                    {entry.type === 'log' && 'Daily Log'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.type === 'injection' && entry.data.doseMg && (
                      <>{entry.data.doseMg}mg · {formatSite(entry.data.site || '')}</>
                    )}
                    {entry.type === 'weight' && entry.data.weightKg && (
                      <>{entry.data.weightKg.toFixed(1)}kg</>
                    )}
                    {entry.type === 'log' && (
                      <>
                        {entry.data.hungerLevel && `Hunger: ${formatHunger(entry.data.hungerLevel)}`}
                        {entry.data.hungerLevel && entry.data.mood && ' · '}
                        {entry.data.mood && `Mood: ${formatMood(entry.data.mood)}`}
                        {(entry.data.hungerLevel || entry.data.mood) && entry.data.steps && ' · '}
                        {entry.data.steps && formatSteps(entry.data.steps)}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entry.time && (
                  <span className="text-sm text-muted-foreground">{entry.time}</span>
                )}
                {onEditEntry && (
                  <button
                    onClick={() => onEditEntry(entry.type)}
                    className="rounded px-2 py-1 text-sm text-primary hover:bg-primary/10"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-muted-foreground">No entries for this day</p>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={onLogWeight}
          className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-foreground hover:bg-muted"
        >
          <span className="text-lg">⚖️</span>
          <span className="text-xs">Log Weight</span>
        </button>
        <button
          onClick={onLogInjection}
          className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-foreground hover:bg-muted"
        >
          <span className="text-lg">💉</span>
          <span className="text-xs">Log Injection</span>
        </button>
        <button
          onClick={onLogDaily}
          className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-foreground hover:bg-muted"
        >
          <span className="text-lg">📝</span>
          <span className="text-xs">Daily Log</span>
        </button>
      </div>
    </div>
  );
}
