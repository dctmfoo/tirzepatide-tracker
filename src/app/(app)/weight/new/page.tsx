'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewWeightPage() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user preferences for default unit
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch('/api/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.weightUnit) {
            setUnit(data.weightUnit as 'kg' | 'lbs');
          }
        }
      } catch {
        // Ignore errors, use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      setError('Please enter a valid weight');
      setSaving(false);
      return;
    }

    // Convert to kg if needed
    const weightKg = unit === 'lbs' ? weightValue * 0.453592 : weightValue;

    try {
      const body = {
        weightKg,
        loggedAt: new Date(date).toISOString(),
        notes: notes || undefined,
      };

      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save weight');
      }

      router.push('/summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-48 rounded bg-card" />
        <div className="h-16 rounded-lg bg-card" />
        <div className="h-16 rounded-lg bg-card" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-card"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-foreground">Log Weight</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Weight Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Weight
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unit === 'kg' ? '70.5' : '155.0'}
              className="flex-1 rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="flex rounded-lg bg-card">
              <button
                type="button"
                onClick={() => setUnit('kg')}
                className={`rounded-l-lg px-4 py-3 text-sm font-medium transition-colors ${
                  unit === 'kg'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-card/80'
                }`}
              >
                kg
              </button>
              <button
                type="button"
                onClick={() => setUnit('lbs')}
                className={`rounded-r-lg px-4 py-3 text-sm font-medium transition-colors ${
                  unit === 'lbs'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-card/80'
                }`}
              >
                lbs
              </button>
            </div>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Date
          </label>
          <input
            type="date"
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
            placeholder="Any notes about this weigh-in..."
            rows={2}
            className="w-full resize-none rounded-lg bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Error Message */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving || !weight}
          className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Weight'}
        </button>
      </form>
    </div>
  );
}
