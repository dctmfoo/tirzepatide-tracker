import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { Section } from '@/components/ui';
import {
  NextInjectionCard,
  TodaysLogCard,
  CurrentStateSection,
  JourneyProgressSection,
  RecentActivitySection,
  EmptyState,
} from '@/components/summary';
import { getSuggestedSite } from '@/lib/utils/injection-logic';

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function getSummaryData(userId: string) {
  const today = getTodayString();

  // Fetch all independent data in parallel for better performance
  const [
    profile,
    preferences,
    recentWeightEntries,
    latestInjection,
    allInjections,
    todayLog,
  ] = await Promise.all([
    // Profile for starting weight and goal
    db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, userId),
    }),
    // User preferences for unit display
    db.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, userId),
    }),
    // Recent weight entries (for current, previous, and activity list)
    db
      .select()
      .from(schema.weightEntries)
      .where(eq(schema.weightEntries.userId, userId))
      .orderBy(desc(schema.weightEntries.recordedAt))
      .limit(3),
    // Latest injection
    db.query.injections.findFirst({
      where: eq(schema.injections.userId, userId),
      orderBy: [desc(schema.injections.injectionDate)],
    }),
    // All injections (for count and activity list)
    db
      .select()
      .from(schema.injections)
      .where(eq(schema.injections.userId, userId))
      .orderBy(desc(schema.injections.injectionDate))
      .limit(10),
    // Today's log with relations
    db.query.dailyLogs.findFirst({
      where: and(
        eq(schema.dailyLogs.userId, userId),
        eq(schema.dailyLogs.logDate, today)
      ),
      with: {
        sideEffects: true,
        activityLog: true,
        mentalLog: true,
        dietLog: true,
      },
    }),
  ]);

  // Extract latest and previous weight from recentWeightEntries
  const latestWeight = recentWeightEntries[0] || null;
  const previousWeight = recentWeightEntries[1] || null;

  // Calculate next injection due
  let nextInjectionDue = null;
  let daysUntilInjection = null;
  let injectionStatus = 'not_started';

  if (latestInjection) {
    const lastDate = new Date(latestInjection.injectionDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 7);
    nextInjectionDue = nextDate.toISOString();

    const now = new Date();
    daysUntilInjection = Math.ceil(
      (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilInjection < 0) {
      injectionStatus = 'overdue';
    } else if (daysUntilInjection === 0) {
      injectionStatus = 'due_today';
    } else if (daysUntilInjection <= 2) {
      injectionStatus = 'due_soon';
    } else {
      injectionStatus = 'on_track';
    }
  }

  // Calculate weight stats
  const startingWeight = profile
    ? Number(profile.startingWeightKg)
    : latestWeight
      ? Number(latestWeight.weightKg)
      : null;
  const currentWeight = latestWeight ? Number(latestWeight.weightKg) : null;
  const goalWeight = profile ? Number(profile.goalWeightKg) : null;

  let remainingToGoal = null;
  let progressPercent = null;

  if (goalWeight && currentWeight) {
    remainingToGoal = currentWeight - goalWeight;
  }

  if (startingWeight && goalWeight && currentWeight) {
    const totalToLose = startingWeight - goalWeight;
    const lostSoFar = startingWeight - currentWeight;
    progressPercent = totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
  }

  // Calculate weight change since last entry
  const lastWeightChange =
    latestWeight && previousWeight
      ? Number(latestWeight.weightKg) - Number(previousWeight.weightKg)
      : null;

  // Treatment duration
  let treatmentDays = null;
  let treatmentWeeks = null;
  if (profile?.treatmentStartDate) {
    const startDate = new Date(profile.treatmentStartDate);
    const now = new Date();
    treatmentDays = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    treatmentWeeks = Math.floor(treatmentDays / 7);
  }

  // Next milestone (every 5kg)
  let nextMilestone = null;
  if (currentWeight && goalWeight) {
    const milestones = [];
    for (let m = Math.floor(currentWeight / 5) * 5; m >= goalWeight; m -= 5) {
      if (m < currentWeight) {
        milestones.push(m);
        break;
      }
    }
    if (milestones.length > 0) {
      nextMilestone = {
        weight: milestones[0],
        remaining: currentWeight - milestones[0],
      };
    }
  }

  // Build recent activities from already-fetched data
  const activities: Array<{
    id: string;
    type: 'weight' | 'injection' | 'log';
    date: string;
    details: string;
  }> = [];

  // Add recent weights (already fetched)
  recentWeightEntries.forEach((w) => {
    activities.push({
      id: `weight-${w.id}`,
      type: 'weight',
      date: w.recordedAt.toISOString(),
      details: `${Number(w.weightKg).toFixed(1)}kg`,
    });
  });

  // Add recent injections (use first 3 from allInjections)
  allInjections.slice(0, 3).forEach((inj) => {
    activities.push({
      id: `injection-${inj.id}`,
      type: 'injection',
      date: inj.injectionDate.toISOString(),
      details: `${Number(inj.doseMg)}mg (${inj.injectionSite})`,
    });
  });

  // Sort activities by date
  activities.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get suggested injection site
  const suggestedSite = latestInjection
    ? getSuggestedSite(latestInjection.injectionSite)
    : 'Abdomen - Left';

  return {
    hasWeight: recentWeightEntries.length > 0,
    hasInjection: allInjections.length > 0,
    weightUnit: preferences?.weightUnit || 'kg',
    injection: {
      nextDue: nextInjectionDue,
      daysUntil: daysUntilInjection,
      currentDose: latestInjection ? Number(latestInjection.doseMg) : null,
      status: injectionStatus,
      suggestedSite,
    },
    today: {
      hasLog: !!todayLog,
      hasDiet: !!todayLog?.dietLog,
      hasActivity: !!todayLog?.activityLog,
      hasMental: !!todayLog?.mentalLog,
      sideEffectsCount: todayLog?.sideEffects?.length || 0,
    },
    currentState: {
      currentWeight,
      lastWeightChange,
      lastWeightDate: latestWeight?.recordedAt.toISOString() || null,
    },
    journey: {
      startWeight: startingWeight,
      currentWeight,
      goalWeight,
      progressPercent,
      remainingToGoal,
      treatmentStartDate: profile?.treatmentStartDate || null,
      treatmentDays,
      treatmentWeeks,
      currentDose: latestInjection ? Number(latestInjection.doseMg) : null,
      nextMilestone,
    },
    activities: activities.slice(0, 5),
  };
}

function SummarySkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4">
      <div className="h-8 w-32 rounded bg-card" />
      <div className="space-y-3">
        <div className="h-32 rounded-lg bg-card" />
        <div className="h-20 rounded-lg bg-card" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-card" />
        <div className="h-24 rounded-lg bg-card" />
      </div>
    </div>
  );
}

async function SummaryContent() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getSummaryData(session.user.id);

  // Show empty state for new users
  if (!data.hasWeight && !data.hasInjection) {
    return <EmptyState hasWeight={data.hasWeight} hasInjection={data.hasInjection} />;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground">Summary</h1>

      {/* Action Required Section */}
      <Section title="Action Required">
        <div className="space-y-3">
          <NextInjectionCard
            nextDue={data.injection.nextDue}
            daysUntil={data.injection.daysUntil}
            currentDose={data.injection.currentDose}
            status={data.injection.status}
            suggestedSite={data.injection.suggestedSite}
          />
          <TodaysLogCard
            hasLog={data.today.hasLog}
            hasDiet={data.today.hasDiet}
            hasActivity={data.today.hasActivity}
            hasMental={data.today.hasMental}
            sideEffectsCount={data.today.sideEffectsCount}
          />
        </div>
      </Section>

      {/* Current State Section */}
      <CurrentStateSection
        currentWeight={data.currentState.currentWeight}
        lastWeightChange={data.currentState.lastWeightChange}
        lastWeightDate={data.currentState.lastWeightDate}
        weightUnit={data.weightUnit}
      />

      {/* Journey Progress Section */}
      <JourneyProgressSection
        startWeight={data.journey.startWeight}
        currentWeight={data.journey.currentWeight}
        goalWeight={data.journey.goalWeight}
        progressPercent={data.journey.progressPercent}
        remainingToGoal={data.journey.remainingToGoal}
        treatmentStartDate={data.journey.treatmentStartDate}
        treatmentDays={data.journey.treatmentDays}
        treatmentWeeks={data.journey.treatmentWeeks}
        currentDose={data.journey.currentDose}
        nextMilestone={data.journey.nextMilestone ?? undefined}
        weightUnit={data.weightUnit}
      />

      {/* Recent Activity Section */}
      <RecentActivitySection activities={data.activities} />
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<SummarySkeleton />}>
      <SummaryContent />
    </Suspense>
  );
}
