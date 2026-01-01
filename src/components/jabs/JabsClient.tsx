'use client';

import { useState } from 'react';
import { JabsStatCard } from './JabsStatCard';
import { InjectionHistoryItem } from './InjectionHistoryItem';
import { LogInjectionModal } from './LogInjectionModal';
import { Button } from '@/components/ui/button';
import type { JabsData } from '@/lib/data/jabs';

type Props = {
  data: JabsData;
};

function formatNextDueDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateWeekNumber(injectionDate: Date, treatmentStartDate?: Date): number {
  const startDate = treatmentStartDate || injectionDate;
  const diffTime = injectionDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function JabsClient({ data }: Props) {
  const [showModal, setShowModal] = useState(false);

  const handleEditInjection = (id: string) => {
    // TODO: Open edit modal with injection data
    console.log('Edit injection:', id);
  };

  // Get treatment start date from first injection
  const treatmentStartDate =
    data.injections.length > 0
      ? new Date(data.injections[data.injections.length - 1].injectionDate)
      : undefined;

  // Identify dose changes
  const injectionsWithDoseChange = data.injections.map((inj, index) => {
    const prevInjection = data.injections[index + 1];
    const isDoseChange = prevInjection && prevInjection.doseMg !== inj.doseMg;
    return {
      ...inj,
      isDoseChange,
      previousDose: prevInjection?.doseMg,
    };
  });

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Jabs</h1>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <JabsStatCard label="Total Injections" value={data.totalInjections} />
        <JabsStatCard
          label="Current Dose"
          value={data.currentDose ? `${data.currentDose}mg` : null}
        />
        <JabsStatCard
          label="Weeks on Current Dose"
          value={data.weeksOnCurrentDose > 0 ? `${data.weeksOnCurrentDose} weeks` : '< 1 week'}
        />
        <JabsStatCard
          label="Next Due"
          value={data.nextDue ? formatNextDueDate(data.nextDue.date) : null}
          sublabel={data.nextDue ? `${data.nextDue.daysUntil} days` : undefined}
        />
      </div>

      {/* Injection History Section */}
      <div className="mt-6 px-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Injection History</h2>
        <div className="space-y-3">
          {injectionsWithDoseChange.map((injection) => (
            <InjectionHistoryItem
              key={injection.id}
              id={injection.id}
              date={new Date(injection.injectionDate)}
              doseMg={injection.doseMg}
              site={injection.injectionSite}
              weekNumber={calculateWeekNumber(
                new Date(injection.injectionDate),
                treatmentStartDate
              )}
              isDoseChange={injection.isDoseChange}
              previousDose={injection.previousDose}
              onEdit={handleEditInjection}
            />
          ))}
        </div>
      </div>

      {/* Log Injection Button */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-4">
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-xl px-8 py-3 shadow-lg"
        >
          + Log Injection
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
