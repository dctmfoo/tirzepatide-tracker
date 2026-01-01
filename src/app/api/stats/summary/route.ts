import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc, asc, count, and } from 'drizzle-orm';

// GET /api/stats/summary - Get summary page data
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile for starting weight and goal
    const profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, session.user.id),
    });

    // Get latest weight
    const latestWeight = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, session.user.id),
      orderBy: [desc(schema.weightEntries.recordedAt)],
    });

    // Get first weight entry
    const firstWeight = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, session.user.id),
      orderBy: [asc(schema.weightEntries.recordedAt)],
    });

    // Get latest injection
    const latestInjection = await db.query.injections.findFirst({
      where: eq(schema.injections.userId, session.user.id),
      orderBy: [desc(schema.injections.injectionDate)],
    });

    // Count total injections - use count instead of fetching all records
    const [{ value: injectionCount }] = await db
      .select({ value: count() })
      .from(schema.injections)
      .where(eq(schema.injections.userId, session.user.id));

    // Get weight entries from last 7 days for trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWeights = await db
      .select()
      .from(schema.weightEntries)
      .where(eq(schema.weightEntries.userId, session.user.id))
      .orderBy(desc(schema.weightEntries.recordedAt))
      .limit(7);

    // Calculate next injection due
    let nextInjectionDue = null;
    let daysUntilInjection = null;
    let injectionStatus = 'not_started';

    if (latestInjection) {
      const lastDate = new Date(latestInjection.injectionDate);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 7);
      nextInjectionDue = nextDate;

      const now = new Date();
      daysUntilInjection = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
    const startingWeight = profile ? Number(profile.startingWeightKg) : (firstWeight ? Number(firstWeight.weightKg) : null);
    const currentWeight = latestWeight ? Number(latestWeight.weightKg) : null;
    const goalWeight = profile ? Number(profile.goalWeightKg) : null;

    let totalLost = null;
    let remainingToGoal = null;
    let progressPercent = null;

    if (startingWeight && currentWeight) {
      totalLost = startingWeight - currentWeight;
    }

    if (goalWeight && currentWeight) {
      remainingToGoal = currentWeight - goalWeight;
    }

    if (startingWeight && goalWeight && currentWeight) {
      const totalToLose = startingWeight - goalWeight;
      const lostSoFar = startingWeight - currentWeight;
      progressPercent = totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
    }

    // Get treatment duration
    let treatmentDays = null;
    let treatmentWeeks = null;
    if (profile?.treatmentStartDate) {
      const startDate = new Date(profile.treatmentStartDate);
      const now = new Date();
      treatmentDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      treatmentWeeks = Math.floor(treatmentDays / 7);
    }

    // Get today's log summary
    const todayDate = new Date();
    const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    const todayLog = await db.query.dailyLogs.findFirst({
      where: and(
        eq(schema.dailyLogs.userId, session.user.id),
        eq(schema.dailyLogs.logDate, today)
      ),
      with: {
        sideEffects: true,
        activityLog: true,
        mentalLog: true,
        dietLog: true,
      },
    });

    return NextResponse.json({
      weight: {
        starting: startingWeight ? Number(startingWeight.toFixed(2)) : null,
        current: currentWeight ? Number(currentWeight.toFixed(2)) : null,
        goal: goalWeight ? Number(goalWeight.toFixed(2)) : null,
        totalLost: totalLost ? Number(totalLost.toFixed(2)) : null,
        remainingToGoal: remainingToGoal ? Number(remainingToGoal.toFixed(2)) : null,
        progressPercent: progressPercent ? Number(progressPercent.toFixed(1)) : null,
        lastRecorded: latestWeight?.recordedAt || null,
      },
      injection: {
        totalCount: Number(injectionCount),
        currentDose: latestInjection ? Number(latestInjection.doseMg) : null,
        lastInjection: latestInjection?.injectionDate || null,
        nextDue: nextInjectionDue,
        daysUntil: daysUntilInjection,
        status: injectionStatus,
      },
      treatment: {
        startDate: profile?.treatmentStartDate || null,
        days: treatmentDays,
        weeks: treatmentWeeks,
      },
      today: {
        hasLog: !!todayLog,
        sideEffectsCount: todayLog?.sideEffects.length || 0,
        hasActivity: !!todayLog?.activityLog,
        hasMental: !!todayLog?.mentalLog,
        hasDiet: !!todayLog?.dietLog,
      },
      recentWeights: recentWeights.map((w) => ({
        weight: Number(w.weightKg),
        date: w.recordedAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/stats/summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
