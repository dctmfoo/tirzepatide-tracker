import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';

// GET /api/daily-logs/week-summary - Get aggregated week data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const weekOf = searchParams.get('weekOf'); // Date string for any day in the week

    // Calculate week start (Monday) and end (Sunday)
    let weekStart: Date;
    const weekEnd: Date = new Date();

    if (weekOf) {
      const targetDate = new Date(weekOf);
      const dayOfWeek = targetDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() + diffToMonday);
    } else {
      // Default to current week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diffToMonday);
    }

    weekEnd.setTime(weekStart.getTime());
    weekEnd.setDate(weekStart.getDate() + 6);

    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];

    // Fetch all logs for the week with related data
    const logs = await db.query.dailyLogs.findMany({
      where: and(
        eq(schema.dailyLogs.userId, session.user.id),
        gte(schema.dailyLogs.logDate, startDateStr),
        lte(schema.dailyLogs.logDate, endDateStr)
      ),
      with: {
        sideEffects: true,
        activityLog: true,
        mentalLog: true,
        dietLog: true,
      },
    });

    // Calculate summaries
    const totalDaysLogged = logs.length;

    // Side effects summary
    const sideEffectCounts: Record<string, { count: number; severities: number[] }> = {};
    logs.forEach((log) => {
      log.sideEffects.forEach((se) => {
        if (!sideEffectCounts[se.effectType]) {
          sideEffectCounts[se.effectType] = { count: 0, severities: [] };
        }
        sideEffectCounts[se.effectType].count++;
        sideEffectCounts[se.effectType].severities.push(se.severity);
      });
    });

    // Activity summary
    let totalWorkoutMinutes = 0;
    let totalSteps = 0;
    let workoutDays = 0;
    const workoutTypes: Record<string, number> = {};

    logs.forEach((log) => {
      if (log.activityLog) {
        if (log.activityLog.durationMinutes) {
          totalWorkoutMinutes += log.activityLog.durationMinutes;
          workoutDays++;
        }
        if (log.activityLog.steps) {
          totalSteps += log.activityLog.steps;
        }
        if (log.activityLog.workoutType) {
          workoutTypes[log.activityLog.workoutType] = (workoutTypes[log.activityLog.workoutType] || 0) + 1;
        }
      }
    });

    // Mental summary
    const moodLevels: string[] = [];
    const motivationLevels: string[] = [];
    const cravingsLevels: string[] = [];

    logs.forEach((log) => {
      if (log.mentalLog) {
        if (log.mentalLog.moodLevel) moodLevels.push(log.mentalLog.moodLevel);
        if (log.mentalLog.motivationLevel) motivationLevels.push(log.mentalLog.motivationLevel);
        if (log.mentalLog.cravingsLevel) cravingsLevels.push(log.mentalLog.cravingsLevel);
      }
    });

    // Diet summary
    let totalMeals = 0;
    let totalProtein = 0;
    let totalWater = 0;
    let dietDaysLogged = 0;

    logs.forEach((log) => {
      if (log.dietLog) {
        dietDaysLogged++;
        if (log.dietLog.mealsCount) totalMeals += log.dietLog.mealsCount;
        if (log.dietLog.proteinGrams) totalProtein += log.dietLog.proteinGrams;
        if (log.dietLog.waterLiters) totalWater += Number(log.dietLog.waterLiters);
      }
    });

    return NextResponse.json({
      weekStart: startDateStr,
      weekEnd: endDateStr,
      daysLogged: totalDaysLogged,
      sideEffects: Object.entries(sideEffectCounts).map(([type, data]) => ({
        type,
        occurrences: data.count,
        severities: data.severities,
      })),
      activity: {
        workoutDays,
        totalMinutes: totalWorkoutMinutes,
        avgMinutesPerWorkout: workoutDays > 0 ? Math.round(totalWorkoutMinutes / workoutDays) : 0,
        totalSteps,
        avgDailySteps: totalDaysLogged > 0 ? Math.round(totalSteps / totalDaysLogged) : 0,
        workoutTypes,
      },
      mental: {
        moods: moodLevels,
        motivations: motivationLevels,
        cravings: cravingsLevels,
      },
      diet: {
        daysLogged: dietDaysLogged,
        totalMeals,
        avgMealsPerDay: dietDaysLogged > 0 ? Number((totalMeals / dietDaysLogged).toFixed(1)) : 0,
        totalProteinGrams: totalProtein,
        avgProteinPerDay: dietDaysLogged > 0 ? Math.round(totalProtein / dietDaysLogged) : 0,
        totalWaterLiters: Number(totalWater.toFixed(2)),
        avgWaterPerDay: dietDaysLogged > 0 ? Number((totalWater / dietDaysLogged).toFixed(2)) : 0,
      },
    });
  } catch (error) {
    console.error('GET /api/daily-logs/week-summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
