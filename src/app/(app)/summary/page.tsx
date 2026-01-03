import { Suspense } from 'react';
import { Bell } from 'lucide-react';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc, asc, and } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HeroStatusCard,
  JourneyProgressCard,
  PhaseCard,
  StreakCard,
  EmptyState,
  getPhaseFromDose,
} from '@/components/journey';
import { getSuggestedSite } from '@/lib/utils/injection-logic';

async function getJourneyData(userId: string) {
  // Fetch all independent data in parallel for better performance
  const [profile, preferences, recentWeightEntries, latestInjection, allInjections] =
    await Promise.all([
      // Profile for starting weight and goal
      db.query.profiles.findFirst({
        where: eq(schema.profiles.userId, userId),
      }),
      // User preferences for unit display
      db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.userId, userId),
      }),
      // Recent weight entries
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
      // All injections for phase calculation
      db
        .select()
        .from(schema.injections)
        .where(eq(schema.injections.userId, userId))
        .orderBy(desc(schema.injections.injectionDate))
        .limit(20),
    ]);

  // Get current dose and find when this phase started
  const currentDose = latestInjection ? Number(latestInjection.doseMg) : null;
  let phaseStartDate: string | null = null;

  if (currentDose && allInjections.length > 0) {
    // Find first injection at current dose (phase start)
    const firstAtCurrentDose = await db
      .select({ injectionDate: schema.injections.injectionDate })
      .from(schema.injections)
      .where(
        and(
          eq(schema.injections.userId, userId),
          eq(schema.injections.doseMg, currentDose.toString())
        )
      )
      .orderBy(asc(schema.injections.injectionDate))
      .limit(1);

    if (firstAtCurrentDose.length > 0) {
      phaseStartDate = firstAtCurrentDose[0].injectionDate.toISOString();
    }
  }

  // Calculate next injection status
  let daysUntilInjection: number | null = null;
  let injectionStatus: 'on_track' | 'due_soon' | 'due_today' | 'overdue' | 'not_started' =
    'not_started';
  let cycleProgress = 0;

  if (latestInjection) {
    const lastDate = new Date(latestInjection.injectionDate);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 7);

    const now = new Date();
    daysUntilInjection = Math.ceil(
      (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate cycle progress (0-100)
    const daysSinceLast = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    cycleProgress = Math.min(100, Math.max(0, (daysSinceLast / 7) * 100));

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
  const latestWeight = recentWeightEntries[0] || null;
  const startingWeight = profile
    ? Number(profile.startingWeightKg)
    : latestWeight
      ? Number(latestWeight.weightKg)
      : null;
  const currentWeight = latestWeight ? Number(latestWeight.weightKg) : null;
  const goalWeight = profile ? Number(profile.goalWeightKg) : null;

  let remainingToGoal: number | null = null;
  let progressPercent: number | null = null;

  if (goalWeight && currentWeight) {
    remainingToGoal = currentWeight - goalWeight;
  }

  if (startingWeight && goalWeight && currentWeight) {
    const totalToLose = startingWeight - goalWeight;
    const lostSoFar = startingWeight - currentWeight;
    progressPercent = totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
  }

  // Treatment duration
  let treatmentWeeks = 1;
  if (profile?.treatmentStartDate) {
    const startDate = new Date(profile.treatmentStartDate);
    const now = new Date();
    const treatmentDays = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    treatmentWeeks = Math.max(1, Math.floor(treatmentDays / 7) + 1);
  }

  // Next milestone (every 5kg)
  let nextMilestone: { weight: number; remaining: number } | null = null;
  if (currentWeight && goalWeight) {
    for (let m = Math.floor(currentWeight / 5) * 5; m >= goalWeight; m -= 5) {
      if (m < currentWeight) {
        nextMilestone = {
          weight: m,
          remaining: currentWeight - m,
        };
        break;
      }
    }
  }

  // Get suggested injection site
  const suggestedSite = latestInjection
    ? getSuggestedSite(latestInjection.injectionSite)
    : 'Abdomen - Left';

  // TODO: Calculate actual logging streak from dailyLogs
  const loggingStreak = 0;

  return {
    hasWeight: recentWeightEntries.length > 0,
    hasInjection: allInjections.length > 0,
    weightUnit: preferences?.weightUnit || 'kg',
    weekNumber: treatmentWeeks,
    injection: {
      daysUntil: daysUntilInjection,
      currentDose,
      suggestedSite,
      status: injectionStatus,
    },
    cycleProgress,
    journey: {
      startWeight: startingWeight,
      currentWeight,
      goalWeight,
      progressPercent,
      remainingToGoal,
      nextMilestone,
    },
    phase: {
      number: getPhaseFromDose(currentDose),
      startDate: phaseStartDate,
      currentDose,
    },
    loggingStreak,
  };
}

function JourneySkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Hero Card */}
      <Skeleton className="h-48 rounded-[1.25rem]" />

      {/* Journey Progress */}
      <Skeleton className="h-56 rounded-[1.25rem]" />

      {/* Phase & Streak */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-[1.25rem]" />
        <Skeleton className="h-24 rounded-[1.25rem]" />
      </div>
    </div>
  );
}

async function JourneyContent() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getJourneyData(session.user.id);

  // Show empty state for new users
  if (!data.hasWeight && !data.hasInjection) {
    return (
      <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
        <EmptyState hasWeight={data.hasWeight} hasInjection={data.hasInjection} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-[1.625rem] font-bold tracking-tight text-foreground">
          Journey
        </h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </Button>
      </header>

      {/* Hero Status Card */}
      <HeroStatusCard
        weekNumber={data.weekNumber}
        nextInjection={{
          daysUntil: data.injection.daysUntil,
          currentDose: data.injection.currentDose,
          suggestedSite: data.injection.suggestedSite,
          status: data.injection.status,
        }}
        cycleProgress={data.cycleProgress}
      />

      {/* Journey Progress Card */}
      <JourneyProgressCard
        startWeight={data.journey.startWeight}
        currentWeight={data.journey.currentWeight}
        goalWeight={data.journey.goalWeight}
        progressPercent={data.journey.progressPercent}
        remainingToGoal={data.journey.remainingToGoal}
        nextMilestone={data.journey.nextMilestone}
        weightUnit={data.weightUnit}
      />

      {/* Phase & Streak Cards */}
      <div className="grid grid-cols-2 gap-3">
        <PhaseCard
          phase={data.phase.number}
          startDate={data.phase.startDate}
          currentDose={data.phase.currentDose}
        />
        <StreakCard streak={data.loggingStreak} />
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<JourneySkeleton />}>
      <JourneyContent />
    </Suspense>
  );
}
