'use client';

import { useState, useEffect, useCallback } from 'react';
import { PeriodTabs, ResultsStatCard } from '@/components/results';
import { WeightChart } from '@/components/charts';

type Period = '1m' | '3m' | '6m' | 'all';

type ResultsData = {
  period: {
    start: string | null;
    end: string;
  };
  weight: {
    data: Array<{ date: string; weight: number }>;
    weeklyAverages: Array<{ weekStart: string; avgWeight: number }>;
    stats: {
      start: number | null;
      current: number | null;
      min: number | null;
      max: number | null;
      avg: number | null;
      change: number | null;
      percentChange: number | null;
    };
    goal: number | null;
    starting: number | null;
  };
  injections: {
    data: Array<{ date: string; dose: number; site: string }>;
    total: number;
    doseHistory: Array<{ date: string; dose: number }>;
    currentDose: number | null;
  };
};

function formatDateRange(start: string | null, end: string): string {
  if (!start) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);

  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = startDate.toLocaleDateString('en-US', formatOptions);
  const endStr = endDate.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' });

  return `${startStr} – ${endStr}`;
}

function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-10 w-full rounded bg-card" />
      <div className="h-6 w-48 rounded bg-card" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-card" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
      <p className="text-lg text-foreground">No data yet</p>
      <p className="mt-2 text-muted-foreground">
        Log your first weight to see your progress chart
      </p>
    </div>
  );
}

export default function ResultsPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Map period to API parameter
      const periodParam = period === '1m' ? '3m' : period; // 1m uses 3m data, filtered client-side
      const response = await fetch(`/api/stats/results?period=${periodParam}`);

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const json = await response.json();
      setData(json);

      // Fetch profile for BMI calculation
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setHeightCm(profile.heightCm ? Number(profile.heightCm) : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.weight.data.length === 0) {
    return <EmptyState />;
  }

  const { weight, injections } = data;
  const bmi = calculateBMI(weight.stats.current, heightCm);

  // Calculate weekly average loss
  const weeklyAvgLoss =
    weight.weeklyAverages.length >= 2
      ? (weight.weeklyAverages[weight.weeklyAverages.length - 1].avgWeight -
          weight.weeklyAverages[0].avgWeight) /
        weight.weeklyAverages.length
      : null;

  // Calculate to goal
  const toGoal =
    weight.stats.current && weight.goal ? weight.stats.current - weight.goal : null;

  return (
    <div className="pb-4">
      {/* Period Tabs */}
      <PeriodTabs selected={period} onChange={setPeriod} />

      {/* Weight Change Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-xl font-bold text-foreground">Weight Change</h2>
        <span className="text-sm text-muted-foreground">
          {formatDateRange(data.period.start, data.period.end)}
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-3 gap-3 px-4">
        <ResultsStatCard
          icon="📦"
          label="Total change"
          value={weight.stats.change !== null ? weight.stats.change.toFixed(2) : null}
          unit="kg"
        />
        <ResultsStatCard
          icon="🧍"
          label="Current BMI"
          value={bmi}
        />
        <ResultsStatCard
          icon="📋"
          label="Weight"
          value={weight.stats.current !== null ? weight.stats.current.toFixed(2) : null}
          unit="kg"
        />
        <ResultsStatCard
          icon="%"
          label="Percent"
          value={weight.stats.percentChange !== null ? weight.stats.percentChange.toFixed(1) : null}
          unit="%"
        />
        <ResultsStatCard
          icon="📊"
          label="Weekly avg"
          value={weeklyAvgLoss !== null ? weeklyAvgLoss.toFixed(2) : null}
          unit="kg/wk"
        />
        <ResultsStatCard
          icon="🚩"
          label="To goal"
          value={toGoal !== null ? toGoal.toFixed(2) : null}
          unit="kg"
        />
      </div>

      {/* Weight Chart */}
      <div className="mt-6 px-4">
        <WeightChart
          data={weight.data}
          doseHistory={injections.doseHistory}
          goalWeight={weight.goal}
        />
      </div>
    </div>
  );
}
