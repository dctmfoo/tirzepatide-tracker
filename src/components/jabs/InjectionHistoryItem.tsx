'use client';

import { Syringe, TrendingUp, TrendingDown, MapPin } from 'lucide-react';

type InjectionHistoryItemProps = {
  id: string;
  date: Date;
  doseMg: number;
  site: string;
  weekNumber: number;
  isDoseChange?: boolean;
  previousDose?: number;
  isFirstInjection?: boolean;
};

// Map API site names to display names
function formatSite(site: string): string {
  const siteMap: Record<string, string> = {
    abdomen: 'Abdomen',
    abdomen_left: 'Abdomen - Left',
    abdomen_right: 'Abdomen - Right',
    thigh_left: 'Thigh - Left',
    thigh_right: 'Thigh - Right',
    arm_left: 'Upper Arm - Left',
    arm_right: 'Upper Arm - Right',
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
  date,
  doseMg,
  site,
  weekNumber,
  isDoseChange,
  previousDose,
  isFirstInjection,
}: InjectionHistoryItemProps) {
  const isIncrease = isDoseChange && previousDose !== undefined && doseMg > previousDose;

  return (
    <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/15">
            <Syringe className="h-5 w-5 text-violet-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-card-foreground">
                {formatDate(date)}
              </span>
              {isDoseChange && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
                    isIncrease
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning'
                  }`}
                >
                  {isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isIncrease ? 'Dose Up' : 'Dose Down'}
                </span>
              )}
              {isFirstInjection && !isDoseChange && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[0.6875rem] font-medium text-violet-500">
                  First Jab
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.875rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {formatSite(site)}
              </span>
              <span>Week {weekNumber}</span>
            </div>
          </div>
        </div>
        <span className="font-display text-lg font-bold text-card-foreground">
          {doseMg}mg
        </span>
      </div>
    </div>
  );
}
