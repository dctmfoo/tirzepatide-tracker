'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import {
  dailyLogs,
  dietLogs,
  activityLogs,
  mentalLogs,
  weightEntries,
  injections,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export type DayData = {
  date: string; // YYYY-MM-DD
  hasWeight: boolean;
  hasCheckin: boolean;
  hasInjection: boolean;
};

export type LogHubData = {
  // Today's progress
  today: {
    date: string;
    formattedDate: string;
    progress: {
      weight: boolean;
      mood: boolean;
      diet: boolean;
      activity: boolean;
    };
    completed: number;
    total: number;
  };
  // Latest weight
  lastWeight: {
    value: number;
    date: Date;
  } | null;
  // Streak
  streak: number;
  // Week data for strip
  weekDays: DayData[];
};

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get array of dates for the week centered on today
 */
function getWeekDates(): Date[] {
  const today = new Date();
  const dates: Date[] = [];

  // Show 2 days before, today, and 4 days after (7 days total)
  for (let i = -2; i <= 4; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Fetch all data needed for the Log Hub page.
 */
export const getLogHubData = cache(async (userId: string): Promise<LogHubData> => {
  const today = new Date();
  const todayStr = formatDate(today);

  // Get week date range
  const weekDates = getWeekDates();
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[weekDates.length - 1]);

  // Fetch data in parallel
  const [
    todayLog,
    latestWeight,
    weekWeights,
    weekInjections,
    weekLogs,
    streakData,
  ] = await Promise.all([
    // Today's daily log
    db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, todayStr)))
      .limit(1),

    // Latest weight entry
    db
      .select({
        weightKg: weightEntries.weightKg,
        recordedAt: weightEntries.recordedAt,
      })
      .from(weightEntries)
      .where(eq(weightEntries.userId, userId))
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1),

    // Weight entries for the week
    db
      .select({
        recordedAt: weightEntries.recordedAt,
      })
      .from(weightEntries)
      .where(
        and(
          eq(weightEntries.userId, userId),
          gte(weightEntries.recordedAt, new Date(startDate)),
          lte(weightEntries.recordedAt, new Date(endDate + 'T23:59:59'))
        )
      ),

    // Injections for the week
    db
      .select({
        injectionDate: injections.injectionDate,
      })
      .from(injections)
      .where(
        and(
          eq(injections.userId, userId),
          gte(injections.injectionDate, new Date(startDate)),
          lte(injections.injectionDate, new Date(endDate + 'T23:59:59'))
        )
      ),

    // Daily logs for the week
    db
      .select({
        logDate: dailyLogs.logDate,
      })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.logDate, startDate),
          lte(dailyLogs.logDate, endDate)
        )
      ),

    // Get recent logs for streak calculation (last 30 days)
    db
      .select({
        logDate: dailyLogs.logDate,
      })
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(desc(dailyLogs.logDate))
      .limit(30),
  ]);

  // Check today's progress
  const todayProgress = {
    weight: false,
    mood: false,
    diet: false,
    activity: false,
  };

  // Check if weight logged today
  const todayWeightEntry = weekWeights.find((w) => {
    const weightDate = formatDate(new Date(w.recordedAt));
    return weightDate === todayStr;
  });
  todayProgress.weight = !!todayWeightEntry;

  // Check other sections if daily log exists
  if (todayLog.length > 0) {
    const logId = todayLog[0].id;

    const [mentalCheck, dietCheck, activityCheck] = await Promise.all([
      db
        .select({ id: mentalLogs.id })
        .from(mentalLogs)
        .where(eq(mentalLogs.dailyLogId, logId))
        .limit(1),
      db
        .select({ id: dietLogs.id })
        .from(dietLogs)
        .where(eq(dietLogs.dailyLogId, logId))
        .limit(1),
      db
        .select({ id: activityLogs.id })
        .from(activityLogs)
        .where(eq(activityLogs.dailyLogId, logId))
        .limit(1),
    ]);

    todayProgress.mood = mentalCheck.length > 0;
    todayProgress.diet = dietCheck.length > 0;
    todayProgress.activity = activityCheck.length > 0;
  }

  const completedCount = Object.values(todayProgress).filter(Boolean).length;

  // Build week days data
  const weightDatesSet = new Set(
    weekWeights.map((w) => formatDate(new Date(w.recordedAt)))
  );
  const injectionDatesSet = new Set(
    weekInjections.map((i) => formatDate(new Date(i.injectionDate)))
  );
  const logDatesSet = new Set(weekLogs.map((l) => l.logDate));

  const weekDays: DayData[] = weekDates.map((date) => {
    const dateStr = formatDate(date);
    return {
      date: dateStr,
      hasWeight: weightDatesSet.has(dateStr),
      hasCheckin: logDatesSet.has(dateStr),
      hasInjection: injectionDatesSet.has(dateStr),
    };
  });

  // Calculate streak
  let streak = 0;
  const logDateStrings = streakData.map((l) => l.logDate);
  const checkDate = new Date(today);

  // Start from today and go backwards
  while (true) {
    const dateStr = formatDate(checkDate);
    // Check if there's a log OR weight entry for this date
    const hasLog = logDateStrings.includes(dateStr);
    const hasWeight = weightDatesSet.has(dateStr);

    if (hasLog || hasWeight) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today has nothing logged, streak is 0
      // If yesterday has nothing, break the streak
      break;
    }

    // Safety limit
    if (streak > 365) break;
  }

  // Format today's date nicely
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return {
    today: {
      date: todayStr,
      formattedDate,
      progress: todayProgress,
      completed: completedCount,
      total: 4,
    },
    lastWeight: latestWeight[0]
      ? {
          value: Number(latestWeight[0].weightKg),
          date: latestWeight[0].recordedAt,
        }
      : null,
    streak,
    weekDays,
  };
});
