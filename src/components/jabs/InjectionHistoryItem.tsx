'use client';

type InjectionHistoryItemProps = {
  id: string;
  date: Date;
  doseMg: number;
  site: string;
  weekNumber: number;
  isDoseChange?: boolean;
  previousDose?: number;
  onEdit?: (id: string) => void;
};

// Map API site names to display names
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InjectionHistoryItem({
  id,
  date,
  doseMg,
  site,
  weekNumber,
  isDoseChange,
  previousDose,
  onEdit,
}: InjectionHistoryItemProps) {
  const isIncrease = isDoseChange && previousDose !== undefined && doseMg > previousDose;

  return (
    <div className="rounded-xl bg-background-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{formatDate(date)}</span>
            {isDoseChange && (
              <span className="rounded-full bg-accent-secondary/20 px-2 py-0.5 text-xs font-medium text-accent-secondary">
                {isIncrease ? '⬆️ Dose Up' : '⬇️ Dose Down'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground-muted">
            {formatSite(site)} · Week {weekNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">{doseMg}mg</span>
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="rounded-lg px-3 py-1 text-sm text-accent-primary hover:bg-accent-primary/10"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
