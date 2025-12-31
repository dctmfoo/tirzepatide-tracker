'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

type WeightDataPoint = {
  date: string;
  weight: number;
};

type DoseChange = {
  date: string;
  dose: number;
};

type WeightChartProps = {
  data: WeightDataPoint[];
  doseHistory?: DoseChange[];
  goalWeight?: number | null;
};

const DOSE_COLORS: Record<number, string> = {
  2.5: '#9ca3af', // gray
  5: '#a855f7', // purple
  7.5: '#14b8a6', // teal
  10: '#3b82f6', // blue
  12.5: '#6366f1', // indigo
  15: '#ec4899', // pink
};

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; weight: number } }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  return (
    <div className="rounded-lg bg-background-card px-3 py-2 shadow-lg border border-foreground-muted/20">
      <p className="text-xs text-foreground-muted">{formatDate(data.payload.date)}</p>
      <p className="font-bold text-foreground">{data.value.toFixed(2)}kg</p>
    </div>
  );
}

export function WeightChart({ data, doseHistory = [], goalWeight }: WeightChartProps) {
  // Process data to add dose information to each point
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Sort dose history by date
    const sortedDoseHistory = [...doseHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return data.map((point) => {
      const pointDate = new Date(point.date).getTime();

      // Find the dose at this point in time
      let currentDose = sortedDoseHistory[0]?.dose || 2.5;
      for (const doseChange of sortedDoseHistory) {
        if (new Date(doseChange.date).getTime() <= pointDate) {
          currentDose = doseChange.dose;
        } else {
          break;
        }
      }

      return {
        ...point,
        dose: currentDose,
        color: DOSE_COLORS[currentDose] || '#9ca3af',
      };
    });
  }, [data, doseHistory]);

  // Group consecutive points by dose for segment rendering
  const segments = useMemo(() => {
    if (chartData.length === 0) return [];

    const result: Array<{
      dose: number;
      color: string;
      points: typeof chartData;
      labelPosition?: { x: number; y: number };
    }> = [];

    let currentSegment: (typeof result)[0] | null = null;

    chartData.forEach((point, index) => {
      if (!currentSegment || currentSegment.dose !== point.dose) {
        // Start new segment, but include last point of previous segment for continuity
        const newSegment = {
          dose: point.dose,
          color: point.color,
          points: currentSegment ? [chartData[index - 1], point] : [point],
        };
        result.push(newSegment);
        currentSegment = newSegment;
      } else {
        currentSegment.points.push(point);
      }
    });

    return result;
  }, [chartData]);

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg bg-background-card">
        <p className="text-foreground-muted">Log your first weight to see your progress chart</p>
      </div>
    );
  }

  // Calculate Y-axis domain
  const weights = data.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = Math.max((maxWeight - minWeight) * 0.15, 2);
  const yMin = Math.floor((minWeight - padding) / 2) * 2;
  const yMax = Math.ceil((maxWeight + padding) / 2) * 2;

  // Generate Y-axis ticks every 2kg
  const yTicks: number[] = [];
  for (let i = yMin; i <= yMax; i += 2) {
    yTicks.push(i);
  }

  return (
    <div className="relative">
      {/* Dose labels */}
      <div className="absolute left-4 top-0 z-10 flex flex-wrap gap-2">
        {segments.map((segment, index) => {
          // Only show label for first occurrence of each dose
          const isFirstOccurrence = segments.findIndex((s) => s.dose === segment.dose) === index;
          if (!isFirstOccurrence) return null;

          return (
            <span
              key={`label-${segment.dose}`}
              className="rounded px-2 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: segment.color }}
            >
              {segment.dose}mg
            </span>
          );
        })}
      </div>

      <div className="h-72 w-full pt-8">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 50, left: 10, bottom: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={true}
              horizontal={true}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatMonth}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              orientation="right"
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={(value) => `${value} kg`}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Goal weight reference line */}
            {goalWeight && goalWeight >= yMin && goalWeight <= yMax && (
              <ReferenceLine
                y={goalWeight}
                stroke="#22c55e"
                strokeDasharray="5 5"
                strokeWidth={1}
                label={{
                  value: 'Goal',
                  position: 'left',
                  fill: '#22c55e',
                  fontSize: 10,
                }}
              />
            )}

            {/* Render line segments with different colors based on dose */}
            {segments.map((segment, index) => (
              <Line
                key={`segment-${index}`}
                data={segment.points}
                type="monotone"
                dataKey="weight"
                stroke={segment.color}
                strokeWidth={2}
                dot={{ fill: segment.color, strokeWidth: 0, r: 4 }}
                activeDot={{ fill: segment.color, strokeWidth: 0, r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
