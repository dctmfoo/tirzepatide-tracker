import 'server-only';

import { cache } from 'react';
import { db } from '@/lib/db';
import {
  dailyLogs,
  weightEntries,
  injections,
  profiles,
} from '@/lib/db/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import type { DailyLogData } from './daily-log';

export type WeightEntryData = {
  id: string;
  weightKg: number;
  recordedAt: Date;
  notes?: string;
  delta?: number; // Change from previous entry
};

export type InjectionData = {
  id: string;
  doseMg: number;
  injectionSite: string;
  injectionDate: Date;
  weekNumber: number; // Week number since treatment start
  notes?: string;
};

export type DayDetailsData = {
  date: string;
  formattedDate: string;
  isToday: boolean;
  weight: WeightEntryData | null;
  injection: InjectionData | null;
  checkin: DailyLogData;
  hasAnyData: boolean;
  allNotes: string[]; // Collected notes from all sources
};

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate week number since treatment start
 */
function calculateWeekNumber(injectionDate: Date, treatmentStartDate: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffMs = injectionDate.getTime() - treatmentStartDate.getTime();
  return Math.floor(diffMs / msPerWeek) + 1;
}

/**
 * Fetch all data for a specific day's details view.
 */
export const getDayDetailsData = cache(async (
  userId: string,
  date: string
): Promise<DayDetailsData> => {
  // Parse the date
  const targetDate = new Date(date + 'T00:00:00.000Z');
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const today = new Date();
  const todayStr = formatDate(today);
  const isToday = date === todayStr;

  // Format the date nicely
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Fetch all data in parallel
  const [
    weightEntry,
    previousWeight,
    injectionEntry,
    profile,
    dailyLogWithRelations,
  ] = await Promise.all([
    // Weight entry for this day
    db
      .select()
      .from(weightEntries)
      .where(
        and(
          eq(weightEntries.userId, userId),
          gte(weightEntries.recordedAt, targetDate),
          lt(weightEntries.recordedAt, nextDate)
        )
      )
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1),

    // Previous weight entry (for delta calculation)
    db
      .select({ weightKg: weightEntries.weightKg })
      .from(weightEntries)
      .where(
        and(
          eq(weightEntries.userId, userId),
          lt(weightEntries.recordedAt, targetDate)
        )
      )
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1),

    // Injection for this day
    db
      .select()
      .from(injections)
      .where(
        and(
          eq(injections.userId, userId),
          gte(injections.injectionDate, targetDate),
          lt(injections.injectionDate, nextDate)
        )
      )
      .limit(1),

    // User profile for treatment start date
    db
      .select({ treatmentStartDate: profiles.treatmentStartDate })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1),

    // Daily log with all related data
    db.query.dailyLogs.findFirst({
      where: and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, date)),
      with: {
        dietLog: true,
        activityLog: true,
        mentalLog: true,
        sideEffects: true,
      },
    }),
  ]);

  // Process weight data
  let weight: WeightEntryData | null = null;
  if (weightEntry[0]) {
    const w = weightEntry[0];
    const currentWeight = Number(w.weightKg);
    const prevWeight = previousWeight[0] ? Number(previousWeight[0].weightKg) : null;

    weight = {
      id: w.id,
      weightKg: currentWeight,
      recordedAt: w.recordedAt,
      notes: w.notes || undefined,
      delta: prevWeight !== null ? currentWeight - prevWeight : undefined,
    };
  }

  // Process injection data
  let injection: InjectionData | null = null;
  if (injectionEntry[0]) {
    const inj = injectionEntry[0];
    const treatmentStart = profile[0]?.treatmentStartDate
      ? new Date(profile[0].treatmentStartDate)
      : inj.injectionDate;

    injection = {
      id: inj.id,
      doseMg: Number(inj.doseMg),
      injectionSite: inj.injectionSite,
      injectionDate: inj.injectionDate,
      weekNumber: calculateWeekNumber(inj.injectionDate, treatmentStart),
      notes: inj.notes || undefined,
    };
  }

  // Process daily log data
  let checkin: DailyLogData = null;
  if (dailyLogWithRelations) {
    const log = dailyLogWithRelations;
    checkin = {
      id: log.id,
      logDate: log.logDate,
      diet: log.dietLog
        ? {
            hungerLevel: log.dietLog.hungerLevel || undefined,
            mealsCount: log.dietLog.mealsCount ? Number(log.dietLog.mealsCount) : undefined,
            proteinGrams: log.dietLog.proteinGrams ? Number(log.dietLog.proteinGrams) : undefined,
            waterLiters: log.dietLog.waterLiters ? Number(log.dietLog.waterLiters) : undefined,
            notes: log.dietLog.notes || undefined,
          }
        : null,
      activity: log.activityLog
        ? {
            workoutType: log.activityLog.workoutType || undefined,
            durationMinutes: log.activityLog.durationMinutes ? Number(log.activityLog.durationMinutes) : undefined,
            steps: log.activityLog.steps ? Number(log.activityLog.steps) : undefined,
            notes: log.activityLog.notes || undefined,
          }
        : null,
      mental: log.mentalLog
        ? {
            motivationLevel: log.mentalLog.motivationLevel || undefined,
            cravingsLevel: log.mentalLog.cravingsLevel || undefined,
            moodLevel: log.mentalLog.moodLevel || undefined,
            notes: log.mentalLog.notes || undefined,
          }
        : null,
      sideEffects: log.sideEffects.map((se) => ({
        id: se.id,
        effectType: se.effectType,
        severity: se.severity,
        notes: se.notes || undefined,
      })),
    };
  }

  // Collect all notes from various sources
  const allNotes: string[] = [];
  if (weight?.notes) allNotes.push(weight.notes);
  if (injection?.notes) allNotes.push(injection.notes);
  if (checkin?.mental?.notes) allNotes.push(checkin.mental.notes);
  if (checkin?.diet?.notes) allNotes.push(checkin.diet.notes);
  if (checkin?.activity?.notes) allNotes.push(checkin.activity.notes);
  // Side effect notes
  checkin?.sideEffects.forEach((se) => {
    if (se.notes) allNotes.push(se.notes);
  });

  const hasAnyData = !!(weight || injection || checkin);

  return {
    date,
    formattedDate,
    isToday,
    weight,
    injection,
    checkin,
    hasAnyData,
    allNotes,
  };
});
