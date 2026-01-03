'use client';

import { MapPin, ArrowRight } from 'lucide-react';

type Props = {
  date: Date;
  daysAgo: number;
  weekNumber: number;
  doseMg: number;
  phase: number;
  site: string;
  suggestedSite: string;
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

function formatDaysAgo(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function LastInjectionHeroCard({
  date,
  daysAgo,
  weekNumber,
  doseMg,
  phase,
  site,
  suggestedSite,
}: Props) {
  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-card-foreground">
          Last Injection
        </h2>
        <p className="mt-0.5 text-[0.9375rem] font-normal text-muted-foreground">
          {formatDaysAgo(daysAgo)} · Week {weekNumber}
        </p>
      </div>

      {/* Nested Card */}
      <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Date + Dose */}
            <h3 className="text-[1.0625rem] font-semibold text-card-foreground">
              {formatDate(date)}
            </h3>
            <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
              {doseMg} mg · Phase {phase}
            </p>

            {/* Injection Site */}
            <div className="mt-3 flex items-center gap-1.5 text-[0.875rem] text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{formatSite(site)}</span>
            </div>

            {/* Next suggested site */}
            <div className="mt-3 flex items-center gap-1.5 text-[0.875rem] font-medium text-success">
              <ArrowRight className="h-4 w-4" />
              <span>Next: {formatSite(suggestedSite)}</span>
            </div>
          </div>

          {/* Large Dose Display */}
          <div className="flex h-[4.25rem] w-[4.25rem] flex-shrink-0 items-center justify-center rounded-2xl bg-violet-500/15">
            <span className="font-display text-2xl font-bold text-violet-500">
              {doseMg}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
