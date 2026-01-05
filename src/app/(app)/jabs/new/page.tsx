'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  INJECTION_SITES,
  getInjectionSiteOptions,
  getSuggestedSite,
} from '@/lib/utils/injection-logic';

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;

export default function NewInjectionPage() {
  const router = useRouter();
  const [doseMg, setDoseMg] = useState('2.5');
  const [site, setSite] = useState(INJECTION_SITES[0]);
  const [suggestedSite, setSuggestedSite] = useState(INJECTION_SITES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch last injection to suggest dose and site
  useEffect(() => {
    async function fetchLastInjection() {
      try {
        const res = await fetch('/api/injections/latest');
        if (res.ok) {
          const data = await res.json();
          if (data.doseMg) {
            setDoseMg(data.doseMg.toString());
          }
          if (data.injectionSite) {
            const suggested = getSuggestedSite(data.injectionSite);
            setSuggestedSite(suggested);
            setSite(suggested);
          }
        }
      } catch {
        // Ignore errors, use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchLastInjection();
  }, []);

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

      router.push('/jabs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-48 rounded bg-card" />
        <div className="h-32 rounded-lg bg-card" />
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
        <h1 className="text-xl font-bold text-foreground">Log Injection</h1>
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
            {getInjectionSiteOptions().map((s) => (
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
        {error && <p className="text-sm text-destructive">{error}</p>}

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
  );
}
