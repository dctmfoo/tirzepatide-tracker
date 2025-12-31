'use client';

import { useState, useEffect, useCallback } from 'react';
import { JabsStatCard, InjectionHistoryItem } from '@/components/jabs';

type Injection = {
  id: string;
  doseMg: number;
  injectionSite: string;
  injectionDate: string;
  batchNumber: string | null;
  notes: string | null;
};

type NextDueData = {
  nextDueDate: string;
  daysUntilDue: number;
  status: string;
  lastInjection: {
    id: string;
    doseMg: number;
    injectionDate: string;
    daysSince: number;
  } | null;
};

type JabsData = {
  injections: Injection[];
  nextDue: NextDueData | null;
  currentDose: number | null;
  weeksOnCurrentDose: number;
  totalInjections: number;
};

function JabsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-6 w-40 rounded bg-card" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onLogInjection }: { onLogInjection: () => void }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 text-5xl">💉</div>
      <p className="text-lg font-medium text-foreground">No injections logged yet</p>
      <p className="mt-2 text-muted-foreground">
        Log your first injection to start tracking your treatment
      </p>
      <button
        onClick={onLogInjection}
        className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
      >
        + Log Injection
      </button>
    </div>
  );
}

function formatNextDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateWeekNumber(injectionDate: string, treatmentStartDate?: string): number {
  const injDate = new Date(injectionDate);
  const startDate = treatmentStartDate ? new Date(treatmentStartDate) : injDate;
  const diffTime = injDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

function calculateWeeksOnCurrentDose(injections: Injection[]): number {
  if (injections.length === 0) return 0;

  const currentDose = injections[0].doseMg;
  let firstAtCurrentDose = new Date(injections[0].injectionDate);

  for (const inj of injections) {
    if (inj.doseMg === currentDose) {
      firstAtCurrentDose = new Date(inj.injectionDate);
    } else {
      break;
    }
  }

  const diffTime = Date.now() - firstAtCurrentDose.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

export default function JabsPage() {
  const [data, setData] = useState<JabsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch injections and next-due in parallel
      const [injectionsRes, nextDueRes] = await Promise.all([
        fetch('/api/injections?limit=50'),
        fetch('/api/injections/next-due'),
      ]);

      if (!injectionsRes.ok) {
        throw new Error('Failed to fetch injections');
      }

      const injectionsData = await injectionsRes.json();
      const injections: Injection[] = injectionsData.injections || [];

      let nextDue: NextDueData | null = null;
      if (nextDueRes.ok) {
        nextDue = await nextDueRes.json();
      }

      const currentDose = injections.length > 0 ? injections[0].doseMg : null;
      const weeksOnCurrentDose = calculateWeeksOnCurrentDose(injections);

      setData({
        injections,
        nextDue,
        currentDose,
        weeksOnCurrentDose,
        totalInjections: injections.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogInjection = () => {
    setShowModal(true);
  };

  const handleEditInjection = (id: string) => {
    // TODO: Open edit modal with injection data
    console.log('Edit injection:', id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInjectionSaved = () => {
    setShowModal(false);
    fetchData(); // Refresh data
  };

  if (loading) {
    return <JabsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.injections.length === 0) {
    return (
      <>
        <EmptyState onLogInjection={handleLogInjection} />
        {showModal && (
          <LogInjectionModal
            onClose={handleCloseModal}
            onSave={handleInjectionSaved}
          />
        )}
      </>
    );
  }

  // Get treatment start date from first injection
  const treatmentStartDate = data.injections.length > 0
    ? data.injections[data.injections.length - 1].injectionDate
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
        <JabsStatCard
          label="Total Injections"
          value={data.totalInjections}
        />
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
          value={data.nextDue ? formatNextDueDate(data.nextDue.nextDueDate) : null}
          sublabel={data.nextDue ? `${data.nextDue.daysUntilDue} days` : undefined}
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
              weekNumber={calculateWeekNumber(injection.injectionDate, treatmentStartDate)}
              isDoseChange={injection.isDoseChange}
              previousDose={injection.previousDose}
              onEdit={handleEditInjection}
            />
          ))}
        </div>
      </div>

      {/* Log Injection Button */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 pb-4">
        <button
          onClick={handleLogInjection}
          className="rounded-xl bg-primary px-8 py-3 font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          + Log Injection
        </button>
      </div>

      {/* Log Injection Modal */}
      {showModal && (
        <LogInjectionModal
          onClose={handleCloseModal}
          onSave={handleInjectionSaved}
          suggestedSite={getSuggestedSite(data.injections[0]?.injectionSite)}
          lastDose={data.currentDose}
        />
      )}
    </div>
  );
}

// Site rotation helper
function getSuggestedSite(lastSite: string | undefined): string {
  if (!lastSite) return 'abdomen';

  const sites = ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'];
  const currentIndex = sites.indexOf(lastSite);
  if (currentIndex === -1) return sites[0];
  return sites[(currentIndex + 1) % sites.length];
}

// Log Injection Modal Component
type LogInjectionModalProps = {
  onClose: () => void;
  onSave: () => void;
  suggestedSite?: string;
  lastDose?: number | null;
  editData?: Injection;
};

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;
const VALID_SITES = [
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'thigh_left', label: 'Thigh - Left' },
  { value: 'thigh_right', label: 'Thigh - Right' },
  { value: 'arm_left', label: 'Arm - Left' },
  { value: 'arm_right', label: 'Arm - Right' },
] as const;

function LogInjectionModal({
  onClose,
  onSave,
  suggestedSite,
  lastDose,
  editData,
}: LogInjectionModalProps) {
  const [doseMg, setDoseMg] = useState(editData?.doseMg?.toString() || lastDose?.toString() || '2.5');
  const [site, setSite] = useState(editData?.injectionSite || suggestedSite || 'abdomen');
  const [date, setDate] = useState(() => {
    if (editData?.injectionDate) {
      return new Date(editData.injectionDate).toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState(editData?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const body = {
        doseMg,
        injectionSite: site,
        injectionDate: new Date(date).toISOString(),
        notes: notes || undefined,
      };

      const response = await fetch('/api/injections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save injection');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-background p-6 sm:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Log Injection</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-card"
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
                  className={`rounded-lg py-3 text-sm font-medium transition-colors ${
                    doseMg === d
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-card/80'
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
              className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full resize-none rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Injection'}
          </button>
        </form>
      </div>
    </div>
  );
}
