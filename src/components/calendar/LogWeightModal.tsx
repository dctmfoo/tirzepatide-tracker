'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
};

export function LogWeightModal({ open, onOpenChange, date }: Props) {
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
        onOpenChange(false);
        setWeight('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Weight</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              disabled={isPending}
              className="w-full rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !weight}
            className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Weight'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
