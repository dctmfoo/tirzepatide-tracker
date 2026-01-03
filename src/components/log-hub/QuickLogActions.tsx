'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scale, ClipboardCheck, ChevronRight } from 'lucide-react';
import { LogWeightModal } from '@/components/calendar/LogWeightModal';

type QuickLogActionsProps = {
  todayDate: string;
  lastWeightValue: number | null;
  hasCheckinToday: boolean;
};

export function QuickLogActions({
  todayDate,
  lastWeightValue,
  hasCheckinToday,
}: QuickLogActionsProps) {
  const [weightModalOpen, setWeightModalOpen] = useState(false);

  return (
    <>
      <section>
        <h3 className="mb-3 px-1 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Log
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Weight Action */}
          <button
            onClick={() => setWeightModalOpen(true)}
            className="rounded-[1.25rem] bg-card p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
              <Scale className="h-5 w-5 text-blue-500" />
            </div>
            <h4 className="font-semibold">Weight</h4>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              {lastWeightValue ? `Last: ${lastWeightValue} kg` : 'Log weight'}
            </p>
          </button>

          {/* Check-in Action */}
          <Link
            href="/log/checkin"
            className={`rounded-[1.25rem] p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${
              hasCheckinToday
                ? 'bg-card'
                : 'border-2 border-primary/30 bg-primary/5'
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
              <ClipboardCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <h4 className="font-semibold">Daily Check-in</h4>
            <p
              className={`mt-0.5 flex items-center gap-1 text-[0.75rem] ${
                hasCheckinToday ? 'text-muted-foreground' : 'font-medium text-primary'
              }`}
            >
              {hasCheckinToday ? 'View / Edit' : 'Continue'}
              <ChevronRight className="h-3 w-3" />
            </p>
          </Link>
        </div>
      </section>

      {/* Weight Modal */}
      <LogWeightModal
        open={weightModalOpen}
        onOpenChange={setWeightModalOpen}
        date={todayDate}
      />
    </>
  );
}
