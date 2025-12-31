import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';

type RouteContext = {
  params: Promise<{ year: string; month: string }>;
};

// GET /api/calendar/[year]/[month] - Get month data for calendar view
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year, month } = await context.params;

    // Validate year and month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of month

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get weight entries for the month
    const weightEntries = await db
      .select()
      .from(schema.weightEntries)
      .where(
        and(
          eq(schema.weightEntries.userId, session.user.id),
          gte(schema.weightEntries.recordedAt, startDate),
          lte(schema.weightEntries.recordedAt, new Date(yearNum, monthNum, 1))
        )
      );

    // Get injections for the month
    const injections = await db
      .select()
      .from(schema.injections)
      .where(
        and(
          eq(schema.injections.userId, session.user.id),
          gte(schema.injections.injectionDate, startDate),
          lte(schema.injections.injectionDate, new Date(yearNum, monthNum, 1))
        )
      );

    // Get daily logs for the month
    const dailyLogs = await db.query.dailyLogs.findMany({
      where: and(
        eq(schema.dailyLogs.userId, session.user.id),
        gte(schema.dailyLogs.logDate, startDateStr),
        lte(schema.dailyLogs.logDate, endDateStr)
      ),
      with: {
        sideEffects: true,
      },
    });

    // Build calendar data structure
    const calendarDays: Record<string, {
      date: string;
      hasWeight: boolean;
      weight?: number;
      hasInjection: boolean;
      injection?: { dose: number; site: string };
      hasLog: boolean;
      sideEffectsCount: number;
    }> = {};

    // Initialize all days of the month
    const daysInMonth = endDate.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      calendarDays[dateStr] = {
        date: dateStr,
        hasWeight: false,
        hasInjection: false,
        hasLog: false,
        sideEffectsCount: 0,
      };
    }

    // Add weight entries
    weightEntries.forEach((entry) => {
      const dateStr = new Date(entry.recordedAt).toISOString().split('T')[0];
      if (calendarDays[dateStr]) {
        calendarDays[dateStr].hasWeight = true;
        calendarDays[dateStr].weight = Number(entry.weightKg);
      }
    });

    // Add injections
    injections.forEach((inj) => {
      const dateStr = new Date(inj.injectionDate).toISOString().split('T')[0];
      if (calendarDays[dateStr]) {
        calendarDays[dateStr].hasInjection = true;
        calendarDays[dateStr].injection = {
          dose: Number(inj.doseMg),
          site: inj.injectionSite,
        };
      }
    });

    // Add daily logs
    dailyLogs.forEach((log) => {
      if (calendarDays[log.logDate]) {
        calendarDays[log.logDate].hasLog = true;
        calendarDays[log.logDate].sideEffectsCount = log.sideEffects.length;
      }
    });

    // Summary stats for the month
    const monthWeights = weightEntries.map((w) => Number(w.weightKg));
    const monthStartWeight = monthWeights.length > 0 ? monthWeights[0] : null;
    const monthEndWeight = monthWeights.length > 0 ? monthWeights[monthWeights.length - 1] : null;

    return NextResponse.json({
      year: yearNum,
      month: monthNum,
      days: Object.values(calendarDays),
      summary: {
        weightEntries: weightEntries.length,
        injections: injections.length,
        logsCompleted: dailyLogs.length,
        startWeight: monthStartWeight ? Number(monthStartWeight.toFixed(2)) : null,
        endWeight: monthEndWeight ? Number(monthEndWeight.toFixed(2)) : null,
        monthlyChange: monthStartWeight && monthEndWeight
          ? Number((monthEndWeight - monthStartWeight).toFixed(2))
          : null,
      },
    });
  } catch (error) {
    console.error('GET /api/calendar/[year]/[month] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
