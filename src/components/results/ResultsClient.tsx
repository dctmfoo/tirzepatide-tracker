'use client';

import { useState, useMemo } from 'react';
import { PeriodTabs } from './PeriodTabs';
import { ResultsStatCard } from './ResultsStatCard';
import { WeightChart } from '@/components/charts';
import type { ResultsData } from '@/lib/data/results';

type Period = '1m' | '3m' | '6m' | 'all';

type Props = {
  data: ResultsData;
};

function formatDateRange(start: Date | null, end: Date): string {
  if (!start) return '';
  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function ResultsClient({ data }: Props) {
  const [period, setPeriod] = useState<Period>('all');

  // Filter data by period
  const filteredData = useMemo(() => {
    if (period === 'all') {
      return {
        weightEntries: data.weightEntries,
        injections: data.injections,
      };
    }

    const now = new Date();
    const months = period === '1m' ? 1 : period === '3m' ? 3 : 6;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

    return {
      weightEntries: data.weightEntries.filter((e) => new Date(e.recordedAt) >= cutoff),
      injections: data.injections.filter((e) => new Date(e.injectionDate) >= cutoff),
    };
  }, [data, period]);

  // Calculate stats from filtered data
  const stats = useMemo(() => {
    const weights = filteredData.weightEntries.map((e) => e.weightKg);
    if (weights.length === 0) return null;

    const current = weights[weights.length - 1];
    const start = weights[0];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
    const change = current - start;
    const percentChange = ((current - start) / start) * 100;

    return { current, start, min, max, avg, change, percentChange };
  }, [filteredData]);

  // Calculate BMI - let React Compiler handle memoization
  const bmi =
    stats?.current && data.profile?.heightCm
      ? calculateBMI(stats.current, data.profile.heightCm)
      : null;

  // Calculate weekly averages
  const weeklyAverages = useMemo(() => {
    const weeks = new Map<string, number[]>();

    filteredData.weightEntries.forEach((entry) => {
      const date = new Date(entry.recordedAt);
      const dayOfWeek = date.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date);
      monday.setDate(date.getDate() + diffToMonday);
      const key = monday.toISOString().split('T')[0];

      if (!weeks.has(key)) weeks.set(key, []);
      weeks.get(key)!.push(entry.weightKg);
    });

    return Array.from(weeks.entries())
      .map(([weekStart, weights]) => ({
        weekStart,
        avgWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
      }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [filteredData]);

  // Calculate weekly average loss
  const weeklyAvgLoss = useMemo(() => {
    if (weeklyAverages.length < 2) return null;
    return (
      (weeklyAverages[weeklyAverages.length - 1].avgWeight - weeklyAverages[0].avgWeight) /
      weeklyAverages.length
    );
  }, [weeklyAverages]);

  // Calculate dose history for chart
  const doseHistory = useMemo(() => {
    const history: { date: string; dose: number }[] = [];
    let lastDose: number | null = null;

    filteredData.injections.forEach((inj) => {
      if (inj.doseMg !== lastDose) {
        history.push({
          date: new Date(inj.injectionDate).toISOString(),
          dose: inj.doseMg,
        });
        lastDose = inj.doseMg;
      }
    });

    return history;
  }, [filteredData]);

  // Format weight data for chart
  const chartData = useMemo(() => {
    return filteredData.weightEntries.map((w) => ({
      date: new Date(w.recordedAt).toISOString(),
      weight: w.weightKg,
    }));
  }, [filteredData]);

  // Calculate period date range
  const periodRange = useMemo(() => {
    if (filteredData.weightEntries.length === 0) {
      return { start: null, end: new Date() };
    }
    return {
      start: new Date(filteredData.weightEntries[0].recordedAt),
      end: new Date(),
    };
  }, [filteredData]);

  // To goal calculation - let React Compiler handle memoization
  const toGoal =
    stats?.current && data.profile?.goalWeightKg
      ? stats.current - data.profile.goalWeightKg
      : null;

  if (!stats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-lg text-foreground">No data for this period</p>
        <p className="mt-2 text-foreground-muted">
          Try selecting a different time range
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Period Tabs */}
      <PeriodTabs selected={period} onChange={setPeriod} />

      {/* Weight Change Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-xl font-bold text-foreground">Weight Change</h2>
        <span className="text-sm text-foreground-muted">
          {formatDateRange(periodRange.start, periodRange.end)}
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-3 gap-3 px-4">
        <ResultsStatCard
          icon="📦"
          label="Total change"
          value={stats.change.toFixed(2)}
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
          value={stats.current.toFixed(2)}
          unit="kg"
        />
        <ResultsStatCard
          icon="%"
          label="Percent"
          value={stats.percentChange.toFixed(1)}
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
          data={chartData}
          doseHistory={doseHistory}
          goalWeight={data.profile?.goalWeightKg ?? null}
        />
      </div>
    </div>
  );
}
