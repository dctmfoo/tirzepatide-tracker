import 'server-only';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { cache } from 'react';

export type InjectionEntry = {
  id: string;
  injectionDate: Date;
  doseMg: number;
  injectionSite: string;
  batchNumber: string | null;
  notes: string | null;
  createdAt: Date;
};

export type JabsData = {
  injections: InjectionEntry[];
  nextDue: {
    date: Date;
    daysUntil: number;
    status: 'on_track' | 'due_soon' | 'due_today' | 'overdue';
  } | null;
  currentDose: number | null;
  weeksOnCurrentDose: number;
  totalInjections: number;
  suggestedSite: string;
};

/**
 * Fetches all data needed for the Jabs page.
 * Uses React cache for request deduplication within a single render.
 */
export const getJabsData = cache(async (userId: string): Promise<JabsData> => {
  const injections = await db
    .select()
    .from(schema.injections)
    .where(eq(schema.injections.userId, userId))
    .orderBy(desc(schema.injections.injectionDate))
    .limit(50);

  const formattedInjections: InjectionEntry[] = injections.map((inj) => ({
    id: inj.id,
    injectionDate: inj.injectionDate,
    doseMg: Number(inj.doseMg),
    injectionSite: inj.injectionSite,
    batchNumber: inj.batchNumber,
    notes: inj.notes,
    createdAt: inj.createdAt,
  }));

  // Calculate next due date
  let nextDue: JabsData['nextDue'] = null;
  if (formattedInjections.length > 0) {
    const lastInjection = formattedInjections[0];
    const nextDate = new Date(lastInjection.injectionDate);
    nextDate.setDate(nextDate.getDate() + 7);

    const now = new Date();
    const daysUntil = Math.ceil(
      (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let status: NonNullable<JabsData['nextDue']>['status'];
    if (daysUntil < 0) status = 'overdue';
    else if (daysUntil === 0) status = 'due_today';
    else if (daysUntil <= 2) status = 'due_soon';
    else status = 'on_track';

    nextDue = { date: nextDate, daysUntil, status };
  }

  // Calculate current dose and weeks on current dose
  const currentDose = formattedInjections.length > 0 ? formattedInjections[0].doseMg : null;

  let weeksOnCurrentDose = 0;
  if (formattedInjections.length > 0 && currentDose !== null) {
    // Find the first injection at current dose (going backwards in time)
    let firstAtCurrentDose = new Date(formattedInjections[0].injectionDate);
    for (const inj of formattedInjections) {
      if (inj.doseMg === currentDose) {
        firstAtCurrentDose = new Date(inj.injectionDate);
      } else {
        break;
      }
    }
    const diffTime = Date.now() - firstAtCurrentDose.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    weeksOnCurrentDose = Math.floor(diffDays / 7);
  }

  // Calculate suggested site (rotate through sites)
  const sites = ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'];
  const lastSite = formattedInjections[0]?.injectionSite ?? 'abdomen';
  const lastIndex = sites.indexOf(lastSite);
  const suggestedSite = lastIndex === -1 ? sites[0] : sites[(lastIndex + 1) % sites.length];

  return {
    injections: formattedInjections,
    nextDue,
    currentDose,
    weeksOnCurrentDose,
    totalInjections: formattedInjections.length,
    suggestedSite,
  };
});
