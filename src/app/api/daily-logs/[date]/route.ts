import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas (same as in route.ts)
const sideEffectSchema = z.object({
  effectType: z.string().min(1).max(50),
  severity: z.enum(['None', 'Mild', 'Moderate', 'Severe']),
  notes: z.string().max(500).nullable().optional(),
});

const activitySchema = z.object({
  workoutType: z.enum(['Strength training', 'Cardio', 'Walking', 'Rest day', 'Other']).nullable().optional(),
  durationMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  steps: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const mentalSchema = z.object({
  motivationLevel: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
  cravingsLevel: z.enum(['None', 'Low', 'Medium', 'High', 'Intense']).nullable().optional(),
  moodLevel: z.enum(['Poor', 'Fair', 'Good', 'Great', 'Excellent']).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const dietSchema = z.object({
  hungerLevel: z.enum(['None', 'Low', 'Moderate', 'High', 'Intense']).nullable().optional(),
  mealsCount: z.number().int().min(0).max(10).nullable().optional(),
  proteinGrams: z.number().int().min(0).nullable().optional(),
  waterLiters: z.number().min(0).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const updateDailyLogSchema = z.object({
  sideEffects: z.array(sideEffectSchema).optional(),
  activity: activitySchema.optional(),
  mental: mentalSchema.optional(),
  diet: dietSchema.optional(),
});

type RouteContext = {
  params: Promise<{ date: string }>;
};

// GET /api/daily-logs/[date] - Get log for specific date
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await context.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const log = await db.query.dailyLogs.findFirst({
      where: and(
        eq(schema.dailyLogs.userId, session.user.id),
        eq(schema.dailyLogs.logDate, date)
      ),
      with: {
        sideEffects: true,
        activityLog: true,
        mentalLog: true,
        dietLog: true,
      },
    });

    if (!log) {
      return NextResponse.json({ error: 'Log not found for this date' }, { status: 404 });
    }

    return NextResponse.json({
      id: log.id,
      logDate: log.logDate,
      sideEffects: log.sideEffects,
      activity: log.activityLog,
      mental: log.mentalLog,
      diet: log.dietLog ? {
        ...log.dietLog,
        waterLiters: log.dietLog.waterLiters ? Number(log.dietLog.waterLiters) : null,
      } : null,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/daily-logs/[date] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/daily-logs/[date] - Update log for specific date
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await context.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateDailyLogSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Find existing log
    let dailyLog = await db.query.dailyLogs.findFirst({
      where: and(
        eq(schema.dailyLogs.userId, session.user.id),
        eq(schema.dailyLogs.logDate, date)
      ),
    });

    // Create if doesn't exist
    if (!dailyLog) {
      const [newLog] = await db
        .insert(schema.dailyLogs)
        .values({
          userId: session.user.id,
          logDate: date,
        })
        .returning();
      dailyLog = newLog;
    } else {
      await db
        .update(schema.dailyLogs)
        .set({ updatedAt: new Date() })
        .where(eq(schema.dailyLogs.id, dailyLog.id));
    }

    const data = validationResult.data;

    // Handle side effects
    if (data.sideEffects !== undefined) {
      await db
        .delete(schema.sideEffects)
        .where(eq(schema.sideEffects.dailyLogId, dailyLog.id));

      if (data.sideEffects.length > 0) {
        await db.insert(schema.sideEffects).values(
          data.sideEffects.map((se) => ({
            dailyLogId: dailyLog.id,
            effectType: se.effectType,
            severity: se.severity,
            notes: se.notes || null,
          }))
        );
      }
    }

    // Handle activity log
    if (data.activity !== undefined) {
      await db
        .delete(schema.activityLogs)
        .where(eq(schema.activityLogs.dailyLogId, dailyLog.id));

      await db.insert(schema.activityLogs).values({
        dailyLogId: dailyLog.id,
        workoutType: data.activity.workoutType || null,
        durationMinutes: data.activity.durationMinutes || null,
        steps: data.activity.steps || null,
        notes: data.activity.notes || null,
      });
    }

    // Handle mental log
    if (data.mental !== undefined) {
      await db
        .delete(schema.mentalLogs)
        .where(eq(schema.mentalLogs.dailyLogId, dailyLog.id));

      await db.insert(schema.mentalLogs).values({
        dailyLogId: dailyLog.id,
        motivationLevel: data.mental.motivationLevel || null,
        cravingsLevel: data.mental.cravingsLevel || null,
        moodLevel: data.mental.moodLevel || null,
        notes: data.mental.notes || null,
      });
    }

    // Handle diet log
    if (data.diet !== undefined) {
      await db
        .delete(schema.dietLogs)
        .where(eq(schema.dietLogs.dailyLogId, dailyLog.id));

      await db.insert(schema.dietLogs).values({
        dailyLogId: dailyLog.id,
        hungerLevel: data.diet.hungerLevel || null,
        mealsCount: data.diet.mealsCount || null,
        proteinGrams: data.diet.proteinGrams || null,
        waterLiters: data.diet.waterLiters?.toString() || null,
        notes: data.diet.notes || null,
      });
    }

    // Fetch and return updated log
    const completeLog = await db.query.dailyLogs.findFirst({
      where: eq(schema.dailyLogs.id, dailyLog.id),
      with: {
        sideEffects: true,
        activityLog: true,
        mentalLog: true,
        dietLog: true,
      },
    });

    return NextResponse.json({
      id: completeLog!.id,
      logDate: completeLog!.logDate,
      sideEffects: completeLog!.sideEffects,
      activity: completeLog!.activityLog,
      mental: completeLog!.mentalLog,
      diet: completeLog!.dietLog ? {
        ...completeLog!.dietLog,
        waterLiters: completeLog!.dietLog.waterLiters ? Number(completeLog!.dietLog.waterLiters) : null,
      } : null,
      createdAt: completeLog!.createdAt,
      updatedAt: completeLog!.updatedAt,
    });
  } catch (error) {
    console.error('PUT /api/daily-logs/[date] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
