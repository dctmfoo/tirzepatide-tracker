'use client';

import { useMemo } from 'react';
import { Area, ComposedChart, Line, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  2.5: 'hsl(220, 9%, 60%)', // gray
  5: 'hsl(270, 91%, 65%)', // purple
  7.5: 'hsl(168, 76%, 42%)', // teal
  10: 'hsl(217, 91%, 60%)', // blue
  12.5: 'hsl(239, 84%, 67%)', // indigo
  15: 'hsl(330, 81%, 60%)', // pink
};


const chartConfig = {
  weight: {
    label: 'Weight',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

function formatXAxis(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        color: DOSE_COLORS[currentDose] || DOSE_COLORS[2.5],
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
    }> = [];

    let currentSegment: (typeof result)[0] | null = null;

    chartData.forEach((point, index) => {
      if (!currentSegment || currentSegment.dose !== point.dose) {
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

  // Get unique doses for legend
  const uniqueDoses = useMemo(() => {
    const doses = new Set<number>();
    segments.forEach((s) => doses.add(s.dose));
    return Array.from(doses).sort((a, b) => a - b);
  }, [segments]);

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden border-border">
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-muted-foreground">Log your first weight to see your progress chart</p>
        </CardContent>
      </Card>
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
    <Card className="flex h-full flex-col overflow-hidden border-border py-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1">
        <CardTitle className="text-sm font-semibold">Progress</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          {uniqueDoses.map((dose) => (
            <span key={dose} className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: DOSE_COLORS[dose] }}
              />
              {dose}mg
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden px-0 pb-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
              minTickGap={40}
            />
            <YAxis
              orientation="right"
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={(value) => `${value}`}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={35}
              className="text-xs"
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0];
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(data.payload?.date)}
                    </p>
                    <p className="font-bold tabular-nums">
                      {Number(data.value).toFixed(1)} kg
                    </p>
                  </div>
                );
              }}
            />

            {/* Goal weight reference line */}
            {goalWeight && goalWeight >= yMin && goalWeight <= yMax && (
              <ReferenceLine
                y={goalWeight}
                stroke="hsl(var(--success))"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                label={{
                  value: 'Goal',
                  position: 'left',
                  fill: 'hsl(var(--success))',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
            )}

            {/* Gradient area fill - hidden from tooltip */}
            <Area
              type="monotone"
              dataKey="weight"
              fill="url(#weightGradient)"
              stroke="none"
              isAnimationActive={false}
              tooltipType="none"
            />

            {/* Render line segments with different colors based on dose */}
            {segments.map((segment, index) => (
              <Line
                key={`segment-${index}`}
                data={segment.points}
                type="monotone"
                dataKey="weight"
                stroke={segment.color}
                strokeWidth={2.5}
                dot={{ fill: segment.color, strokeWidth: 0, r: 3 }}
                activeDot={{ fill: segment.color, strokeWidth: 2, stroke: 'hsl(var(--background))', r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
