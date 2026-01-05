'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInjection } from '@/lib/actions/injections';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  INJECTION_SITES,
  getInjectionSiteOptions,
} from '@/lib/utils/injection-logic';

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedSite?: string;
  lastDose?: number | null;
  /** If provided, uses this date instead of showing datetime picker */
  fixedDate?: string;
};

export function LogInjectionModal({
  open,
  onOpenChange,
  suggestedSite,
  lastDose,
  fixedDate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [doseMg, setDoseMg] = useState(lastDose?.toString() || '2.5');
  const [site, setSite] = useState(suggestedSite || INJECTION_SITES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        // If fixedDate provided, use it with default time, otherwise use datetime picker value
        const injectionDate = fixedDate
          ? new Date(fixedDate + 'T09:00:00').toISOString()
          : new Date(date).toISOString();

        const result = await createInjection({
          doseMg,
          injectionSite: site,
          injectionDate,
          notes: notes || undefined,
        });

        if (result.error) {
          setError(result.error);
        } else {
          router.refresh();
          onOpenChange(false);
          // Reset form
          setDoseMg(lastDose?.toString() || '2.5');
          setSite(suggestedSite || INJECTION_SITES[0]);
          setNotes('');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Injection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dose Selection */}
          <div>
            <label className="mb-2 block text-[0.875rem] font-medium text-foreground">
              Dose
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VALID_DOSES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDoseMg(d)}
                  disabled={isPending}
                  className={`rounded-xl py-3 text-[0.875rem] font-medium transition-colors ${
                    doseMg === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <span className="font-display">{d}</span> mg
                </button>
              ))}
            </div>
          </div>

          {/* Site Selection */}
          <div>
            <label className="mb-2 block text-[0.875rem] font-medium text-foreground">
              Injection Site
            </label>
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              disabled={isPending}
              className="w-full rounded-xl border border-border/40 bg-secondary/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {getInjectionSiteOptions().map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                  {s.value === suggestedSite ? ' (Suggested)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date/Time - only show if no fixedDate */}
          {!fixedDate && (
            <div>
              <label className="mb-2 block text-[0.875rem] font-medium text-foreground">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-border/40 bg-secondary/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Notes - only show if no fixedDate (simplified modal for calendar) */}
          {!fixedDate && (
            <div>
              <label className="mb-2 block text-[0.875rem] font-medium text-foreground">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this injection..."
                rows={2}
                disabled={isPending}
                className="w-full resize-none rounded-xl border border-border/40 bg-secondary/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Injection'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
