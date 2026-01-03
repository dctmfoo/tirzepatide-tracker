import { Calendar } from 'lucide-react';

type PhaseCardProps = {
  phase: number;
  startDate: string | null;
  currentDose: number | null;
};

// Map dose to phase number
const DOSE_TO_PHASE: Record<string, number> = {
  '2.5': 1,
  '5': 2,
  '7.5': 3,
  '10': 4,
  '12.5': 5,
  '15': 6,
};

export function getPhaseFromDose(dose: number | null): number {
  if (dose === null) return 1;
  return DOSE_TO_PHASE[dose.toString()] || 1;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function PhaseCard({ phase, startDate, currentDose }: PhaseCardProps) {
  return (
    <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      <div className="mb-2.5 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-card-foreground">Phase {phase}</span>
      </div>
      <p className="text-[0.875rem] text-muted-foreground">
        Started {formatDate(startDate)}
      </p>
      {currentDose && (
        <p className="mt-0.5 text-[0.875rem] text-muted-foreground/70">
          Dose · {currentDose} mg
        </p>
      )}
    </div>
  );
}
