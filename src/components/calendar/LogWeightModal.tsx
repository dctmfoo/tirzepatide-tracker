'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  date: string;
  onClose: () => void;
};

export function LogWeightModal({ date, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    setError(null);

    startTransition(async () => {
      try {
        const recordedAt = new Date(date + 'T12:00:00').toISOString();
        const response = await fetch('/api/weight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weightKg: parseFloat(weight),
            recordedAt,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save weight');
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
          <h2 className="text-xl font-bold text-foreground">Log Weight</h2>
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
            <label className="mb-2 block text-sm font-medium text-foreground">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              disabled={isPending}
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={isPending || !weight}
            className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Weight'}
          </button>
        </form>
      </div>
    </div>
  );
}
