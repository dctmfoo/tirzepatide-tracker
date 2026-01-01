import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { cache } from 'react';

export type WeightEntry = {
  id: string;
  recordedAt: Date;
  weightKg: number;
  notes: string | null;
};

export type InjectionEntry = {
  id: string;
  injectionDate: Date;
  doseMg: number;
  site: string;
};

export type ResultsData = {
  weightEntries: WeightEntry[];
  injections: InjectionEntry[];
  profile: {
    goalWeightKg: number | null;
    startingWeightKg: number | null;
    heightCm: number | null;
    treatmentStartDate: Date | null;
  } | null;
  preferences: {
    weightUnit: 'kg' | 'lbs' | 'stone';
  } | null;
};

/**
 * Fetches all data needed for the Results page.
 * Uses React cache for request deduplication within a single render.
 */
export const getResultsData = cache(async (userId: string): Promise<ResultsData> => {
  const [weightEntries, injections, profile, preferences] = await Promise.all([
    db
      .select({
        id: schema.weightEntries.id,
        recordedAt: schema.weightEntries.recordedAt,
        weightKg: schema.weightEntries.weightKg,
        notes: schema.weightEntries.notes,
      })
      .from(schema.weightEntries)
      .where(eq(schema.weightEntries.userId, userId))
      .orderBy(asc(schema.weightEntries.recordedAt)),

    db
      .select({
        id: schema.injections.id,
        injectionDate: schema.injections.injectionDate,
        doseMg: schema.injections.doseMg,
        site: schema.injections.injectionSite,
      })
      .from(schema.injections)
      .where(eq(schema.injections.userId, userId))
      .orderBy(asc(schema.injections.injectionDate)),

    db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, userId),
      columns: {
        goalWeightKg: true,
        startingWeightKg: true,
        heightCm: true,
        treatmentStartDate: true,
      },
    }),

    db.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, userId),
      columns: {
        weightUnit: true,
      },
    }),
  ]);

  return {
    weightEntries: weightEntries.map((w) => ({
      ...w,
      weightKg: Number(w.weightKg),
    })),
    injections: injections.map((inj) => ({
      ...inj,
      doseMg: Number(inj.doseMg),
    })),
    profile: profile
      ? {
          goalWeightKg: profile.goalWeightKg ? Number(profile.goalWeightKg) : null,
          startingWeightKg: profile.startingWeightKg ? Number(profile.startingWeightKg) : null,
          heightCm: profile.heightCm ? Number(profile.heightCm) : null,
          treatmentStartDate: profile.treatmentStartDate ? new Date(profile.treatmentStartDate) : null,
        }
      : null,
    preferences: preferences
      ? {
          weightUnit: preferences.weightUnit as 'kg' | 'lbs' | 'stone',
        }
      : null,
  };
});
