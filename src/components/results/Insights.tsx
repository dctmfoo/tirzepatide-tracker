import { TrendingDown, TrendingUp, Zap, Target, Award, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Insight = {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

type InsightsProps = {
  weeklyAvgLoss: number | null;
  totalWeeks: number;
  currentDose: number | null;
  previousDose: number | null;
  doseChangeWeeks: number | null;
  toGoal: number | null;
  percentChange: number;
};

export function Insights({
  weeklyAvgLoss,
  totalWeeks,
  currentDose,
  previousDose,
  doseChangeWeeks,
  toGoal,
  percentChange,
}: InsightsProps) {
  const insights: Insight[] = [];

  // Steady progress insight
  if (weeklyAvgLoss !== null && weeklyAvgLoss < 0 && totalWeeks >= 4) {
    insights.push({
      id: 'steady-progress',
      icon: TrendingDown,
      iconColor: 'text-success',
      iconBg: 'bg-success/15',
      title: 'Steady Progress',
      description: `You've lost weight consistently for ${totalWeeks} weeks. Keep it up!`,
    });
  }

  // Dose increase insight
  if (currentDose && previousDose && currentDose > previousDose && doseChangeWeeks !== null) {
    const weeksText = doseChangeWeeks === 1 ? '1 week' : `${doseChangeWeeks} weeks`;
    insights.push({
      id: 'dose-increased',
      icon: Zap,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/15',
      title: 'Dose Increased',
      description: `You moved to ${currentDose}mg ${weeksText} ago. Monitor for changes in weight loss rate.`,
    });
  }

  // Close to goal insight
  if (toGoal !== null && toGoal > 0 && toGoal <= 5) {
    insights.push({
      id: 'close-to-goal',
      icon: Target,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/15',
      title: 'Almost There!',
      description: `Only ${toGoal.toFixed(1)}kg to go. You're so close to your goal!`,
    });
  }

  // Milestone insight
  if (percentChange <= -5 && percentChange > -10) {
    insights.push({
      id: 'milestone-5',
      icon: Award,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/15',
      title: '5% Milestone',
      description: 'You\'ve lost over 5% of your starting weight. This is clinically significant!',
    });
  } else if (percentChange <= -10) {
    insights.push({
      id: 'milestone-10',
      icon: Award,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/15',
      title: '10% Milestone',
      description: 'Amazing! You\'ve lost over 10% of your starting weight. Major health benefits unlocked!',
    });
  }

  // Weight gain warning
  if (weeklyAvgLoss !== null && weeklyAvgLoss > 0) {
    insights.push({
      id: 'weight-gain',
      icon: TrendingUp,
      iconColor: 'text-destructive',
      iconBg: 'bg-destructive/15',
      title: 'Weight Trending Up',
      description: 'Your average weight is increasing. Consider reviewing your diet and activity levels.',
    });
  }

  // Plateau insight
  if (weeklyAvgLoss !== null && Math.abs(weeklyAvgLoss) < 0.1 && totalWeeks >= 3) {
    insights.push({
      id: 'plateau',
      icon: AlertCircle,
      iconColor: 'text-warning',
      iconBg: 'bg-warning/15',
      title: 'Possible Plateau',
      description: 'Weight has been stable for a few weeks. This is normal and often temporary.',
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="shrink-0 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Insights</h2>
      <div className="space-y-2">
        {insights.slice(0, 2).map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${insight.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${insight.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{insight.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
