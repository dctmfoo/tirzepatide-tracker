'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarGrid, DayDetail } from '@/components/calendar';

type CalendarDay = {
  date: string;
  hasWeight: boolean;
  weight?: number;
  hasInjection: boolean;
  injection?: { dose: number; site: string };
  hasLog: boolean;
  sideEffectsCount: number;
};

type CalendarData = {
  year: number;
  month: number;
  days: CalendarDay[];
  summary: {
    weightEntries: number;
    injections: number;
    logsCompleted: number;
  };
};

type DayEntry = {
  type: 'injection' | 'weight' | 'log';
  time?: string;
  data: {
    doseMg?: number;
    site?: string;
    weightKg?: number;
    hungerLevel?: string;
    mood?: string;
    steps?: number;
  };
};

function CalendarSkeleton() {
  return (
    <div className="animate-pulse p-4">
      {/* Month header */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="h-8 w-8 rounded bg-background-card" />
        <div className="h-6 w-40 rounded bg-background-card" />
        <div className="h-8 w-8 rounded bg-background-card" />
      </div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 py-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-background-card" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-background-card" />
        ))}
      </div>
    </div>
  );
}

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar data for the month
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar/${year}/${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      const data = await response.json();
      setCalendarData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // Fetch day details when a date is selected
  const fetchDayDetails = useCallback(async (dateStr: string) => {
    if (!calendarData) return;

    const dayData = calendarData.days.find((d) => d.date === dateStr);
    if (!dayData) {
      setDayEntries([]);
      return;
    }

    const entries: DayEntry[] = [];

    // Add injection entry if present
    if (dayData.hasInjection && dayData.injection) {
      entries.push({
        type: 'injection',
        data: {
          doseMg: dayData.injection.dose,
          site: dayData.injection.site,
        },
      });
    }

    // Add weight entry if present
    if (dayData.hasWeight && dayData.weight) {
      entries.push({
        type: 'weight',
        data: {
          weightKg: dayData.weight,
        },
      });
    }

    // Add daily log if present - fetch full details
    if (dayData.hasLog) {
      try {
        const response = await fetch(`/api/daily-logs/${dateStr}`);
        if (response.ok) {
          const logData = await response.json();
          entries.push({
            type: 'log',
            data: {
              hungerLevel: logData.hungerLevel,
              mood: logData.mood,
              steps: logData.steps,
            },
          });
        }
      } catch {
        // If fetch fails, add a basic log entry
        entries.push({
          type: 'log',
          data: {},
        });
      }
    }

    setDayEntries(entries);
  }, [calendarData]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  useEffect(() => {
    if (calendarData && selectedDate) {
      fetchDayDetails(selectedDate);
    }
  }, [calendarData, selectedDate, fetchDayDetails]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showInjectionModal, setShowInjectionModal] = useState(false);
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);

  const handleLogWeight = () => setShowWeightModal(true);
  const handleLogInjection = () => setShowInjectionModal(true);
  const handleLogDaily = () => setShowDailyLogModal(true);

  const handleModalClose = () => {
    setShowWeightModal(false);
    setShowInjectionModal(false);
    setShowDailyLogModal(false);
  };

  const handleEntrySaved = () => {
    handleModalClose();
    fetchCalendarData();
    if (selectedDate) {
      fetchDayDetails(selectedDate);
    }
  };

  if (loading) {
    return <CalendarSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-4">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        year={year}
        month={month}
        days={calendarData?.days || []}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Day Detail */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          entries={dayEntries}
          onLogWeight={handleLogWeight}
          onLogInjection={handleLogInjection}
          onLogDaily={handleLogDaily}
        />
      )}

      {/* Modals */}
      {showWeightModal && (
        <LogWeightModal
          date={selectedDate}
          onClose={handleModalClose}
          onSave={handleEntrySaved}
        />
      )}

      {showInjectionModal && (
        <LogInjectionModal
          date={selectedDate}
          onClose={handleModalClose}
          onSave={handleEntrySaved}
        />
      )}

      {showDailyLogModal && (
        <LogDailyModal
          date={selectedDate}
          onClose={handleModalClose}
          onSave={handleEntrySaved}
        />
      )}
    </div>
  );
}

// Log Weight Modal
type LogWeightModalProps = {
  date: string;
  onClose: () => void;
  onSave: () => void;
};

function LogWeightModal({ date, onClose, onSave }: LogWeightModalProps) {
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    setSaving(true);
    setError(null);

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
          <h2 className="text-xl font-bold text-foreground">Log Weight</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-foreground-muted hover:bg-background-card">
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
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={saving || !weight}
            className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Weight'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Log Injection Modal
type LogInjectionModalProps = {
  date: string;
  onClose: () => void;
  onSave: () => void;
};

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;
const VALID_SITES = [
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'thigh_left', label: 'Thigh - Left' },
  { value: 'thigh_right', label: 'Thigh - Right' },
  { value: 'arm_left', label: 'Arm - Left' },
  { value: 'arm_right', label: 'Arm - Right' },
] as const;

function LogInjectionModal({ date, onClose, onSave }: LogInjectionModalProps) {
  const [doseMg, setDoseMg] = useState('2.5');
  const [site, setSite] = useState('abdomen');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

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
          <button onClick={onClose} className="rounded-lg p-2 text-foreground-muted hover:bg-background-card">
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
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {VALID_SITES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Injection'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Log Daily Modal
type LogDailyModalProps = {
  date: string;
  onClose: () => void;
  onSave: () => void;
};

const HUNGER_LEVELS = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'extreme', label: 'Extreme' },
] as const;

const MOOD_LEVELS = [
  { value: 'great', label: '😊 Great' },
  { value: 'good', label: '🙂 Good' },
  { value: 'okay', label: '😐 Okay' },
  { value: 'low', label: '😔 Low' },
  { value: 'bad', label: '😢 Bad' },
] as const;

function LogDailyModal({ date, onClose, onSave }: LogDailyModalProps) {
  const [hungerLevel, setHungerLevel] = useState('moderate');
  const [mood, setMood] = useState('good');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [steps, setSteps] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate: date,
          hungerLevel,
          mood,
          energyLevel,
          steps: steps ? parseInt(steps) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save daily log');
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
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Daily Log</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-foreground-muted hover:bg-background-card">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hunger Level */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Hunger Level</label>
            <div className="flex flex-wrap gap-2">
              {HUNGER_LEVELS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHungerLevel(h.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    hungerLevel === h.value
                      ? 'bg-accent-primary text-background'
                      : 'bg-background-card text-foreground hover:bg-background-card/80'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_LEVELS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    mood === m.value
                      ? 'bg-accent-primary text-background'
                      : 'bg-background-card text-foreground hover:bg-background-card/80'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Energy Level: {energyLevel}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full accent-accent-primary"
            />
          </div>

          {/* Steps */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Steps (optional)</label>
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Enter steps"
              className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Daily Log'}
          </button>
        </form>
      </div>
    </div>
  );
}
