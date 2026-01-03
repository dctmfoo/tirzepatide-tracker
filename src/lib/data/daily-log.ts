import 'server-only';

import { cache } from 'react';
import { db } from '@/lib/db';
import { dailyLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type SideEffectData = {
  id?: string;
  effectType: string;
  severity: number; // 0-5 scale: 0=None, 1-2=Mild, 3-4=Moderate, 5=Severe
  notes?: string;
};

export type ActivityData = {
  workoutType?: string;
  durationMinutes?: number;
  steps?: number;
  notes?: string;
};

export type MentalData = {
  motivationLevel?: string;
  cravingsLevel?: string;
  moodLevel?: string;
  notes?: string;
};

export type DietData = {
  hungerLevel?: string;
  mealsCount?: number;
  proteinGrams?: number;
  waterLiters?: number;
  notes?: string;
};

export type DailyLogData = {
  id: string;
  logDate: string;
  sideEffects: SideEffectData[];
  activity: ActivityData | null;
  mental: MentalData | null;
  diet: DietData | null;
} | null;

/**
 * Fetch daily log data for a specific date using Drizzle relations (single query)
 */
export const getDailyLogData = cache(async (
  userId: string,
  date: string
): Promise<DailyLogData> => {
  // Fetch daily log with all related data in a single query using Drizzle relations
  const log = await db.query.dailyLogs.findFirst({
    where: and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, date)),
    with: {
      dietLog: true,
      activityLog: true,
      mentalLog: true,
      sideEffects: true,
    },
  });

  if (!log) {
    return null;
  }

  return {
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
});
