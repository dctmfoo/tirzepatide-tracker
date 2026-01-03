import 'server-only';

import { cache } from 'react';
import { db } from '@/lib/db';
import { dailyLogs, dietLogs, activityLogs, mentalLogs, sideEffects } from '@/lib/db/schema';
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
 * Fetch daily log data for a specific date
 */
export const getDailyLogData = cache(async (
  userId: string,
  date: string
): Promise<DailyLogData> => {
  // Find the daily log for this date
  const [log] = await db
    .select()
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, userId),
        eq(dailyLogs.logDate, date)
      )
    )
    .limit(1);

  if (!log) {
    return null;
  }

  // Fetch related data in parallel
  const [dietData, activityData, mentalData, sideEffectsData] = await Promise.all([
    db.select().from(dietLogs).where(eq(dietLogs.dailyLogId, log.id)).limit(1),
    db.select().from(activityLogs).where(eq(activityLogs.dailyLogId, log.id)).limit(1),
    db.select().from(mentalLogs).where(eq(mentalLogs.dailyLogId, log.id)).limit(1),
    db.select().from(sideEffects).where(eq(sideEffects.dailyLogId, log.id)),
  ]);

  return {
    id: log.id,
    logDate: log.logDate,
    diet: dietData[0]
      ? {
          hungerLevel: dietData[0].hungerLevel || undefined,
          mealsCount: dietData[0].mealsCount ? Number(dietData[0].mealsCount) : undefined,
          proteinGrams: dietData[0].proteinGrams ? Number(dietData[0].proteinGrams) : undefined,
          waterLiters: dietData[0].waterLiters ? Number(dietData[0].waterLiters) : undefined,
          notes: dietData[0].notes || undefined,
        }
      : null,
    activity: activityData[0]
      ? {
          workoutType: activityData[0].workoutType || undefined,
          durationMinutes: activityData[0].durationMinutes ? Number(activityData[0].durationMinutes) : undefined,
          steps: activityData[0].steps ? Number(activityData[0].steps) : undefined,
          notes: activityData[0].notes || undefined,
        }
      : null,
    mental: mentalData[0]
      ? {
          motivationLevel: mentalData[0].motivationLevel || undefined,
          cravingsLevel: mentalData[0].cravingsLevel || undefined,
          moodLevel: mentalData[0].moodLevel || undefined,
          notes: mentalData[0].notes || undefined,
        }
      : null,
    sideEffects: sideEffectsData.map((se) => ({
      id: se.id,
      effectType: se.effectType,
      severity: se.severity,
      notes: se.notes || undefined,
    })),
  };
});
