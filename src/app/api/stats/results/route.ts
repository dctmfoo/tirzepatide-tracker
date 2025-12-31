import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

// GET /api/stats/results - Get results page data (charts)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all'; // all, 3m, 6m, 1y
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on period
    let dateStart: Date | null = null;
    const dateEnd = new Date();

    if (startDate && endDate) {
      dateStart = new Date(startDate);
    } else {
      switch (period) {
        case '3m':
          dateStart = new Date();
          dateStart.setMonth(dateStart.getMonth() - 3);
          break;
        case '6m':
          dateStart = new Date();
          dateStart.setMonth(dateStart.getMonth() - 6);
          break;
        case '1y':
          dateStart = new Date();
          dateStart.setFullYear(dateStart.getFullYear() - 1);
          break;
        case 'all':
        default:
          dateStart = null;
      }
    }

    // Build weight query conditions
    const weightConditions = [eq(schema.weightEntries.userId, session.user.id)];
    if (dateStart) {
      weightConditions.push(gte(schema.weightEntries.recordedAt, dateStart));
    }
    if (endDate) {
      weightConditions.push(lte(schema.weightEntries.recordedAt, new Date(endDate)));
    }

    // Get weight entries
    const weightEntries = await db
      .select()
      .from(schema.weightEntries)
      .where(and(...weightConditions))
      .orderBy(asc(schema.weightEntries.recordedAt));

    // Build injection query conditions
    const injectionConditions = [eq(schema.injections.userId, session.user.id)];
    if (dateStart) {
      injectionConditions.push(gte(schema.injections.injectionDate, dateStart));
    }
    if (endDate) {
      injectionConditions.push(lte(schema.injections.injectionDate, new Date(endDate)));
    }

    // Get injections
    const injections = await db
      .select()
      .from(schema.injections)
      .where(and(...injectionConditions))
      .orderBy(asc(schema.injections.injectionDate));

    // Get profile for goal weight
    const profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, session.user.id),
    });

    // Get first and latest weights for stats
    const firstWeight = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, session.user.id),
      orderBy: [asc(schema.weightEntries.recordedAt)],
    });

    // Format weight data for charts
    const weightData = weightEntries.map((w) => ({
      date: w.recordedAt,
      weight: Number(w.weightKg),
    }));

    // Format injection data for charts (show dose changes over time)
    const injectionData = injections.map((inj) => ({
      date: inj.injectionDate,
      dose: Number(inj.doseMg),
      site: inj.injectionSite,
    }));

    // Calculate weekly averages for smoother trends
    const weeklyAverages: { weekStart: string; avgWeight: number }[] = [];
    if (weightEntries.length > 0) {
      const weightsByWeek: Record<string, number[]> = {};
      weightEntries.forEach((w) => {
        const date = new Date(w.recordedAt);
        const dayOfWeek = date.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
        const weekKey = monday.toISOString().split('T')[0];

        if (!weightsByWeek[weekKey]) {
          weightsByWeek[weekKey] = [];
        }
        weightsByWeek[weekKey].push(Number(w.weightKg));
      });

      Object.entries(weightsByWeek).forEach(([weekStart, weights]) => {
        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
        weeklyAverages.push({
          weekStart,
          avgWeight: Number(avg.toFixed(2)),
        });
      });

      weeklyAverages.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    }

    // Calculate stats
    const weights = weightEntries.map((w) => Number(w.weightKg));
    const startWeight = weights.length > 0 ? weights[0] : null;
    const currentWeight = weights.length > 0 ? weights[weights.length - 1] : null;
    const minWeight = weights.length > 0 ? Math.min(...weights) : null;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null;

    // Dose progression
    const doseHistory: { date: Date; dose: number }[] = [];
    let lastDose: number | null = null;
    injections.forEach((inj) => {
      const dose = Number(inj.doseMg);
      if (dose !== lastDose) {
        doseHistory.push({ date: inj.injectionDate, dose });
        lastDose = dose;
      }
    });

    return NextResponse.json({
      period: {
        start: dateStart?.toISOString() || (firstWeight?.recordedAt?.toISOString() ?? null),
        end: dateEnd.toISOString(),
      },
      weight: {
        data: weightData,
        weeklyAverages,
        stats: {
          start: startWeight ? Number(startWeight.toFixed(2)) : null,
          current: currentWeight ? Number(currentWeight.toFixed(2)) : null,
          min: minWeight ? Number(minWeight.toFixed(2)) : null,
          max: maxWeight ? Number(maxWeight.toFixed(2)) : null,
          avg: avgWeight ? Number(avgWeight.toFixed(2)) : null,
          change: startWeight && currentWeight ? Number((currentWeight - startWeight).toFixed(2)) : null,
          percentChange: startWeight && currentWeight
            ? Number((((currentWeight - startWeight) / startWeight) * 100).toFixed(2))
            : null,
        },
        goal: profile ? Number(profile.goalWeightKg) : null,
        starting: profile ? Number(profile.startingWeightKg) : null,
      },
      injections: {
        data: injectionData,
        total: injections.length,
        doseHistory,
        currentDose: injections.length > 0 ? Number(injections[injections.length - 1].doseMg) : null,
      },
    });
  } catch (error) {
    console.error('GET /api/stats/results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
