'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;
const VALID_SITES = [
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'thigh_left', label: 'Thigh - Left' },
  { value: 'thigh_right', label: 'Thigh - Right' },
  { value: 'arm_left', label: 'Arm - Left' },
  { value: 'arm_right', label: 'Arm - Right' },
] as const;

type Props = {
  date: string;
  onClose: () => void;
};

export function CalendarLogInjectionModal({ date, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [doseMg, setDoseMg] = useState('2.5');
  const [site, setSite] = useState('abdomen');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const injectionDate = new Date(date + 'T09:00:00').toISOString();
        const response = await fetch('/api/injections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doseMg,
            injectionSite: site,
            injectionDate,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save injection');
        }

        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
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
            disabled={isPending}
            className="rounded-lg p-2 text-foreground-muted hover:bg-background-card"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Dose</label>
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

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Injection Site</label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {VALID_SITES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

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
