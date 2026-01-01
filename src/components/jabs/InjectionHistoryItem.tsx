'use client';

import { Syringe, TrendingUp, TrendingDown, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
            <Syringe className="h-5 w-5 text-violet-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{formatDate(date)}</span>
              {isDoseChange && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isIncrease
                    ? 'bg-success/15 text-success'
                    : 'bg-warning/15 text-warning'
                }`}>
                  {isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isIncrease ? 'Dose Up' : 'Dose Down'}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {formatSite(site)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Week {weekNumber}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tabular-nums text-foreground">{doseMg}mg</span>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(id)}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
