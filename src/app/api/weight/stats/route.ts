import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

// GET /api/weight/stats - Get weight statistics for a period
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [eq(schema.weightEntries.userId, session.user.id)];

    if (startDate) {
      conditions.push(gte(schema.weightEntries.recordedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(schema.weightEntries.recordedAt, new Date(endDate)));
    }

    // Get all entries in the period
    const entries = await db
      .select()
      .from(schema.weightEntries)
      .where(and(...conditions))
      .orderBy(asc(schema.weightEntries.recordedAt));

    if (entries.length === 0) {
      return NextResponse.json({
        count: 0,
        startWeight: null,
        endWeight: null,
        minWeight: null,
        maxWeight: null,
        avgWeight: null,
        totalChange: null,
        percentChange: null,
      });
    }

    const weights = entries.map((e) => Number(e.weightKg));
    const startWeight = weights[0];
    const endWeight = weights[weights.length - 1];
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const totalChange = endWeight - startWeight;
    const percentChange = ((totalChange / startWeight) * 100);

    // Get user's starting weight from profile for total progress
    const profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, session.user.id),
    });

    // Get the very first weight entry ever
    const firstEver = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, session.user.id),
      orderBy: [asc(schema.weightEntries.recordedAt)],
    });

    // Get the most recent weight entry
    const latestEntry = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, session.user.id),
      orderBy: [desc(schema.weightEntries.recordedAt)],
    });

    const startingWeight = profile ? Number(profile.startingWeightKg) : (firstEver ? Number(firstEver.weightKg) : null);
    const goalWeight = profile ? Number(profile.goalWeightKg) : null;
    const currentWeight = latestEntry ? Number(latestEntry.weightKg) : null;

    // Calculate progress towards goal
    let progressPercent = null;
    if (startingWeight && goalWeight && currentWeight) {
      const totalToLose = startingWeight - goalWeight;
      const lostSoFar = startingWeight - currentWeight;
      progressPercent = totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
    }

    return NextResponse.json({
      // Period stats
      period: {
        count: entries.length,
        startWeight: Number(startWeight.toFixed(2)),
        endWeight: Number(endWeight.toFixed(2)),
        minWeight: Number(minWeight.toFixed(2)),
        maxWeight: Number(maxWeight.toFixed(2)),
        avgWeight: Number(avgWeight.toFixed(2)),
        totalChange: Number(totalChange.toFixed(2)),
        percentChange: Number(percentChange.toFixed(2)),
      },
      // Overall stats
      overall: {
        startingWeight: startingWeight ? Number(startingWeight.toFixed(2)) : null,
        currentWeight: currentWeight ? Number(currentWeight.toFixed(2)) : null,
        goalWeight: goalWeight ? Number(goalWeight.toFixed(2)) : null,
        totalLost: startingWeight && currentWeight ? Number((startingWeight - currentWeight).toFixed(2)) : null,
        remainingToGoal: goalWeight && currentWeight ? Number((currentWeight - goalWeight).toFixed(2)) : null,
        progressPercent: progressPercent ? Number(progressPercent.toFixed(1)) : null,
      },
    });
  } catch (error) {
    console.error('GET /api/weight/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
