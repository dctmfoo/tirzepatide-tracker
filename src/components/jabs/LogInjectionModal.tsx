'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInjection } from '@/lib/actions/injections';

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;
const VALID_SITES = [
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'thigh_left', label: 'Thigh - Left' },
  { value: 'thigh_right', label: 'Thigh - Right' },
  { value: 'arm_left', label: 'Arm - Left' },
  { value: 'arm_right', label: 'Arm - Right' },
] as const;

type Props = {
  onClose: () => void;
  suggestedSite?: string;
  lastDose?: number | null;
};

export function LogInjectionModal({ onClose, suggestedSite, lastDose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [doseMg, setDoseMg] = useState(lastDose?.toString() || '2.5');
  const [site, setSite] = useState(suggestedSite || 'abdomen');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createInjection({
        doseMg,
        injectionSite: site,
        injectionDate: new Date(date).toISOString(),
        notes: notes || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-background p-6 sm:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Log Injection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-foreground-muted hover:bg-background-card"
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dose Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Dose
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VALID_DOSES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDoseMg(d)}
                  disabled={isPending}
                  className={`rounded-lg py-3 text-sm font-medium transition-colors ${
                    doseMg === d
                      ? 'bg-accent-primary text-background'
                      : 'bg-background-card text-foreground hover:bg-background-card/80'
                  }`}
                >
                  {d} mg
                </button>
              ))}
            </div>
          </div>

          {/* Site Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Injection Site
            </label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {VALID_SITES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                  {s.value === suggestedSite ? ' (Suggested)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date/Time */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this injection..."
              rows={2}
              disabled={isPending}
              className="w-full resize-none rounded-lg bg-background-card px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-error">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Injection'}
          </button>
        </form>
      </div>
    </div>
  );
}
