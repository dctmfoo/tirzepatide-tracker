'use client';

import { useState } from 'react';
import { Syringe, Pill, Calendar, Clock, Plus } from 'lucide-react';
import { JabsStatCard } from './JabsStatCard';
import { InjectionHistoryItem } from './InjectionHistoryItem';
import { LogInjectionModal } from './LogInjectionModal';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui';
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

function getNextDueColor(status: string | undefined): string {
  if (status === 'overdue') return 'destructive';
  if (status === 'due_today' || status === 'due_soon') return 'warning';
  return 'success';
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
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4 pb-32">
      {/* Page Header */}
      <h1 className="text-xl font-bold text-foreground">Jabs</h1>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <JabsStatCard
          icon={Syringe}
          iconColor="violet"
          label="Total Injections"
          value={data.totalInjections}
        />
        <JabsStatCard
          icon={Pill}
          iconColor="amber"
          label="Current Dose"
          value={data.currentDose}
          unit="mg"
        />
        <JabsStatCard
          icon={Calendar}
          iconColor="blue"
          label="On Current Dose"
          value={data.weeksOnCurrentDose > 0 ? data.weeksOnCurrentDose : '< 1'}
          unit={data.weeksOnCurrentDose > 0 ? 'weeks' : 'week'}
        />
        <JabsStatCard
          icon={Clock}
          iconColor={getNextDueColor(data.nextDue?.status)}
          label="Next Due"
          value={data.nextDue ? formatNextDueDate(data.nextDue.date) : null}
          sublabel={data.nextDue ? `${data.nextDue.daysUntil} days` : undefined}
        />
      </div>

      {/* Injection History Section */}
      <Section title="Injection History">
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
      </Section>

      {/* Log Injection Button */}
      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-4">
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-xl px-8 py-3 shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
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
