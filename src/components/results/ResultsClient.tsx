'use client';

import { useState, useMemo } from 'react';
import { Scale, User, BarChart3, Flag } from 'lucide-react';
import { PeriodTabs } from './PeriodTabs';
import { HeroStat } from './HeroStat';
import { Insights } from './Insights';
import { WeightChart } from '@/components/charts';
import { StatCard } from '@/components/ui';
import type { ResultsData } from '@/lib/data/results';

type Period = '1m' | '3m' | '6m' | 'all';

type Props = {
  data: ResultsData;
};

function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function getBMICategory(bmi: number): { text: string; variant: 'success' | 'warning' | 'destructive' | 'default' } {
  if (bmi < 18.5) return { text: 'Underweight', variant: 'warning' };
  if (bmi < 25) return { text: 'Normal', variant: 'success' };
  if (bmi < 30) return { text: 'Overweight', variant: 'warning' };
  if (bmi < 35) return { text: 'Obese I', variant: 'destructive' };
  if (bmi < 40) return { text: 'Obese II', variant: 'destructive' };
  return { text: 'Obese III', variant: 'destructive' };
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
    const change = current - start;
    const percentChange = ((current - start) / start) * 100;

    return { current, start, change, percentChange };
  }, [filteredData]);

  // Calculate BMI
  const bmi = stats?.current && data.profile?.heightCm
    ? calculateBMI(stats.current, data.profile.heightCm)
    : null;

  const bmiCategory = bmi ? getBMICategory(bmi) : null;

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

  // Get current and previous dose for insights
  const { currentDose, previousDose, doseChangeWeeks } = useMemo(() => {
    if (doseHistory.length === 0) {
      return { currentDose: null, previousDose: null, doseChangeWeeks: null };
    }
    const current = doseHistory[doseHistory.length - 1];
    const previous = doseHistory.length > 1 ? doseHistory[doseHistory.length - 2] : null;

    let weeks = null;
    if (current) {
      const changeDate = new Date(current.date);
      const now = new Date();
      weeks = Math.floor((now.getTime() - changeDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    }

    return {
      currentDose: current?.dose ?? null,
      previousDose: previous?.dose ?? null,
      doseChangeWeeks: weeks,
    };
  }, [doseHistory]);

  // Format weight data for chart
  const chartData = useMemo(() => {
    return filteredData.weightEntries.map((w) => ({
      date: new Date(w.recordedAt).toISOString(),
      weight: w.weightKg,
    }));
  }, [filteredData]);

  // To goal calculation
  const toGoal = stats?.current && data.profile?.goalWeightKg
    ? stats.current - data.profile.goalWeightKg
    : null;

  // Goal progress percentage (0-100)
  const goalProgress = useMemo(() => {
    if (!data.profile?.goalWeightKg || !data.profile?.startingWeightKg || !stats?.current) {
      return null;
    }
    const totalToLose = data.profile.startingWeightKg - data.profile.goalWeightKg;
    if (totalToLose <= 0) return null;
    const lost = data.profile.startingWeightKg - stats.current;
    const progress = (lost / totalToLose) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [data.profile, stats]);

  if (!stats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-lg text-foreground">No data for this period</p>
        <p className="mt-2 text-muted-foreground">
          Try selecting a different time range
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header + Period Tabs */}
      <header className="flex items-center justify-between">
        <h1 className="text-[1.625rem] font-bold tracking-tight text-foreground">
          Results
        </h1>
        <PeriodTabs selected={period} onChange={setPeriod} />
      </header>

      {/* Hero Stat Section */}
      <HeroStat
        totalChange={stats.change}
        percentChange={stats.percentChange}
        currentWeight={stats.current}
        goalWeight={data.profile?.goalWeightKg ?? null}
        goalProgress={goalProgress}
        toGoal={toGoal}
      />

      {/* Secondary Stats Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Scale}
          iconColor="blue"
          label="Current"
          value={stats.current.toFixed(1)}
          unit="kg"
        />
        <StatCard
          icon={User}
          iconColor="amber"
          label="BMI"
          value={bmi}
          badge={bmiCategory ? { text: bmiCategory.text, variant: bmiCategory.variant } : undefined}
        />
        <StatCard
          icon={BarChart3}
          iconColor="emerald"
          label="Weekly Avg"
          value={weeklyAvgLoss !== null ? weeklyAvgLoss.toFixed(2) : null}
          unit="kg/wk"
        />
        <StatCard
          icon={Flag}
          iconColor="violet"
          label="Starting"
          value={data.profile?.startingWeightKg?.toFixed(1) ?? null}
          unit="kg"
        />
      </div>

      {/* Weight Chart Card */}
      <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[1.0625rem] font-semibold text-card-foreground">
            Weight Trend
          </h3>
          <span className="text-[0.75rem] text-muted-foreground">
            {chartData.length} entries
          </span>
        </div>
        <div className="h-56">
          <WeightChart
            data={chartData}
            doseHistory={doseHistory}
            goalWeight={data.profile?.goalWeightKg ?? null}
          />
        </div>
      </section>

      {/* Insights Section */}
      <Insights
        weeklyAvgLoss={weeklyAvgLoss}
        totalWeeks={weeklyAverages.length}
        currentDose={currentDose}
        previousDose={previousDose}
        doseChangeWeeks={doseChangeWeeks}
        toGoal={toGoal}
        percentChange={stats.percentChange}
      />
    </div>
  );
}
