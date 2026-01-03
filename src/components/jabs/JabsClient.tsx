'use client';

import { useState } from 'react';
import { Syringe, Pill, Calendar, Plus, Bell } from 'lucide-react';
import { InjectionHistoryItem } from './InjectionHistoryItem';
import { LogInjectionModal } from './LogInjectionModal';
import { LastInjectionHeroCard } from './LastInjectionHeroCard';
import { JabsStatCard } from './JabsStatCard';
import { Button } from '@/components/ui/button';
import type { JabsData } from '@/lib/data/jabs';

type Props = {
  data: JabsData;
};

function calculateWeekNumber(
  injectionDate: Date,
  treatmentStartDate: Date | null
): number {
  if (!treatmentStartDate) return 1;
  const diffTime = injectionDate.getTime() - treatmentStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function JabsClient({ data }: Props) {
  const [showModal, setShowModal] = useState(false);

  // Identify dose changes and first injection
  const injectionsWithMeta = data.injections.map((inj, index) => {
    const prevInjection = data.injections[index + 1];
    const isDoseChange = prevInjection && prevInjection.doseMg !== inj.doseMg;
    const isFirstInjection = index === data.injections.length - 1;
    return {
      ...inj,
      isDoseChange,
      previousDose: prevInjection?.doseMg,
      isFirstInjection,
    };
  });

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4 pb-32">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-[1.625rem] font-bold tracking-tight text-card-foreground">
          Jabs
        </h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </Button>
      </header>

      {/* Last Injection Hero Card */}
      {data.lastInjection && (
        <LastInjectionHeroCard
          date={data.lastInjection.date}
          daysAgo={data.lastInjection.daysAgo}
          weekNumber={data.lastInjection.weekNumber}
          doseMg={data.lastInjection.doseMg}
          phase={data.lastInjection.phase}
          site={data.lastInjection.site}
          suggestedSite={data.suggestedSite}
        />
      )}

      {/* Stats Grid - 3 columns */}
      <section className="grid grid-cols-3 gap-3">
        <JabsStatCard
          icon={Syringe}
          iconColor="violet"
          value={data.totalInjections}
          label="Total"
        />
        <JabsStatCard
          icon={Pill}
          iconColor="amber"
          value={data.currentDose ?? 0}
          unit="mg"
          label="Dose"
        />
        <JabsStatCard
          icon={Calendar}
          iconColor="blue"
          value={data.weeksOnCurrentDose > 0 ? data.weeksOnCurrentDose : '<1'}
          unit={data.weeksOnCurrentDose > 0 ? 'wks' : 'wk'}
          label="On dose"
        />
      </section>

      {/* Injection History Section */}
      <section className="mb-4">
        <h3 className="mb-3 text-[1.0625rem] font-semibold text-card-foreground">
          History
        </h3>
        <div className="space-y-3">
          {injectionsWithMeta.map((injection) => (
            <InjectionHistoryItem
              key={injection.id}
              id={injection.id}
              date={new Date(injection.injectionDate)}
              doseMg={injection.doseMg}
              site={injection.injectionSite}
              weekNumber={calculateWeekNumber(
                new Date(injection.injectionDate),
                data.treatmentStartDate
              )}
              isDoseChange={injection.isDoseChange}
              previousDose={injection.previousDose}
              isFirstInjection={injection.isFirstInjection}
            />
          ))}
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-4">
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-card-foreground px-8 py-3 font-semibold text-card shadow-lg hover:opacity-90"
        >
          <Plus className="h-5 w-5" />
          Log Injection
        </Button>
      </div>

      {/* Log Injection Modal */}
      <LogInjectionModal
        open={showModal}
        onOpenChange={setShowModal}
        suggestedSite={data.suggestedSite}
        lastDose={data.currentDose}
      />
    </div>
  );
}
