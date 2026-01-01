import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { cache } from 'react';

export type CalendarDay = {
  date: string;
  hasWeight: boolean;
  weight?: number;
  hasInjection: boolean;
  injection?: { dose: number; site: string };
  hasLog: boolean;
  sideEffectsCount: number;
};

export type CalendarData = {
  year: number;
  month: number;
  days: CalendarDay[];
  summary: {
    weightEntries: number;
    injections: number;
    logsCompleted: number;
  };
};

/**
 * Fetches calendar data for a specific month.
 * Uses React cache for request deduplication within a single render.
 */
export const getCalendarData = cache(
  async (userId: string, year: number, month: number): Promise<CalendarData> => {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const [weights, injections, dailyLogs] = await Promise.all([
      db
        .select({
          id: schema.weightEntries.id,
          recordedAt: schema.weightEntries.recordedAt,
          weightKg: schema.weightEntries.weightKg,
        })
        .from(schema.weightEntries)
        .where(
          and(
            eq(schema.weightEntries.userId, userId),
            gte(schema.weightEntries.recordedAt, startDate),
            lte(schema.weightEntries.recordedAt, endDate)
          )
        ),

      db
        .select({
          id: schema.injections.id,
          injectionDate: schema.injections.injectionDate,
          doseMg: schema.injections.doseMg,
          site: schema.injections.injectionSite,
        })
        .from(schema.injections)
        .where(
          and(
            eq(schema.injections.userId, userId),
            gte(schema.injections.injectionDate, startDate),
            lte(schema.injections.injectionDate, endDate)
          )
        ),

      db.query.dailyLogs.findMany({
        where: and(
          eq(schema.dailyLogs.userId, userId),
          gte(schema.dailyLogs.logDate, startStr),
          lte(schema.dailyLogs.logDate, endStr)
        ),
        with: {
          sideEffects: true,
        },
      }),
    ]);

    // Build a map of dates to their data
    const dayMap = new Map<string, CalendarDay>();

    // Initialize all days in the month
    const daysInMonth = endDate.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dayMap.set(dateStr, {
        date: dateStr,
        hasWeight: false,
        hasInjection: false,
        hasLog: false,
        sideEffectsCount: 0,
      });
    }

    // Add weights
    for (const weight of weights) {
      const dateStr = new Date(weight.recordedAt).toISOString().split('T')[0];
      const day = dayMap.get(dateStr);
      if (day) {
        day.hasWeight = true;
        day.weight = Number(weight.weightKg);
      }
    }

    // Add injections
    for (const injection of injections) {
      const dateStr = new Date(injection.injectionDate).toISOString().split('T')[0];
      const day = dayMap.get(dateStr);
      if (day) {
        day.hasInjection = true;
        day.injection = {
          dose: Number(injection.doseMg),
          site: injection.site,
        };
      }
    }

    // Add daily logs
    for (const log of dailyLogs) {
      const dateStr = log.logDate;
      const day = dayMap.get(dateStr);
      if (day) {
        day.hasLog = true;
        day.sideEffectsCount = log.sideEffects?.length ?? 0;
      }
    }

    return {
      year,
      month,
      days: Array.from(dayMap.values()),
      summary: {
        weightEntries: weights.length,
        injections: injections.length,
        logsCompleted: dailyLogs.length,
      },
    };
  }
);
