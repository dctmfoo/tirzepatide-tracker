import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const sideEffectSchema = z.object({
  effectType: z.string().min(1).max(50),
  severity: z.number().int().min(0).max(5), // 0-5 scale: 0=None, 1-2=Mild, 3-4=Moderate, 5=Severe
  notes: z.string().max(500).nullable().optional(),
});

const activitySchema = z.object({
  workoutType: z.enum(['Strength training', 'Cardio', 'Walking', 'Rest day', 'Other']).optional(),
  durationMinutes: z.number().int().min(0).max(1440).optional(),
  steps: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

const mentalSchema = z.object({
  motivationLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  cravingsLevel: z.enum(['None', 'Low', 'Medium', 'High', 'Intense']).optional(),
  moodLevel: z.enum(['Poor', 'Fair', 'Good', 'Great', 'Excellent']).optional(),
  notes: z.string().max(500).optional(),
});

const dietSchema = z.object({
  hungerLevel: z.enum(['None', 'Low', 'Moderate', 'High', 'Intense']).optional(),
  mealsCount: z.number().int().min(0).max(10).optional(),
  proteinGrams: z.number().int().min(0).optional(),
  waterLiters: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

const createDailyLogSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sideEffects: z.array(sideEffectSchema).optional(),
  activity: activitySchema.optional(),
  mental: mentalSchema.optional(),
  diet: dietSchema.optional(),
});

// GET /api/daily-logs - List logs with date range
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [eq(schema.dailyLogs.userId, session.user.id)];

    if (startDate) {
      conditions.push(gte(schema.dailyLogs.logDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.dailyLogs.logDate, endDate));
    }

    const logs = await db.query.dailyLogs.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.dailyLogs.logDate)],
      limit,
      offset,
      with: {
        sideEffects: true,
        activityLog: true,
        mentalLog: true,
        dietLog: true,
      },
    });

    const formattedLogs = logs.map((log) => ({
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
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        limit,
        offset,
        hasMore: logs.length === limit,
      },
    });
  } catch (error) {
    console.error('GET /api/daily-logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/daily-logs - Create or update log for a date
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createDailyLogSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if log exists for this date
    let dailyLog = await db.query.dailyLogs.findFirst({
      where: and(
        eq(schema.dailyLogs.userId, session.user.id),
        eq(schema.dailyLogs.logDate, data.logDate)
      ),
    });

    // Create or get existing log
    if (!dailyLog) {
      const [newLog] = await db
        .insert(schema.dailyLogs)
        .values({
          userId: session.user.id,
          logDate: data.logDate,
        })
        .returning();
      dailyLog = newLog;
    } else {
      // Update the timestamp
      await db
        .update(schema.dailyLogs)
        .set({ updatedAt: new Date() })
        .where(eq(schema.dailyLogs.id, dailyLog.id));
    }

    const logId = dailyLog.id;

    // Run all delete and insert operations in parallel
    const ops: Promise<unknown>[] = [];

    // Side effects: delete then insert
    if (data.sideEffects) {
      ops.push(
        db.delete(schema.sideEffects).where(eq(schema.sideEffects.dailyLogId, logId))
          .then(() => {
            if (data.sideEffects && data.sideEffects.length > 0) {
              return db.insert(schema.sideEffects).values(
                data.sideEffects.map((se) => ({
                  dailyLogId: logId,
                  effectType: se.effectType,
                  severity: se.severity,
                  notes: se.notes || null,
                }))
              );
            }
          })
      );
    }

    // Activity: delete then insert
    if (data.activity) {
      ops.push(
        db.delete(schema.activityLogs).where(eq(schema.activityLogs.dailyLogId, logId))
          .then(() => db.insert(schema.activityLogs).values({
            dailyLogId: logId,
            workoutType: data.activity!.workoutType || null,
            durationMinutes: data.activity!.durationMinutes || null,
            steps: data.activity!.steps || null,
            notes: data.activity!.notes || null,
          }))
      );
    }

    // Mental: delete then insert
    if (data.mental) {
      ops.push(
        db.delete(schema.mentalLogs).where(eq(schema.mentalLogs.dailyLogId, logId))
          .then(() => db.insert(schema.mentalLogs).values({
            dailyLogId: logId,
            motivationLevel: data.mental!.motivationLevel || null,
            cravingsLevel: data.mental!.cravingsLevel || null,
            moodLevel: data.mental!.moodLevel || null,
            notes: data.mental!.notes || null,
          }))
      );
    }

    // Diet: delete then insert
    if (data.diet) {
      ops.push(
        db.delete(schema.dietLogs).where(eq(schema.dietLogs.dailyLogId, logId))
          .then(() => db.insert(schema.dietLogs).values({
            dailyLogId: logId,
            hungerLevel: data.diet!.hungerLevel || null,
            mealsCount: data.diet!.mealsCount || null,
            proteinGrams: data.diet!.proteinGrams || null,
            waterLiters: data.diet!.waterLiters?.toString() || null,
            notes: data.diet!.notes || null,
          }))
      );
    }

    await Promise.all(ops);

    // Return the data we already have - no need to refetch
    return NextResponse.json({
      id: logId,
      logDate: data.logDate,
      sideEffects: data.sideEffects?.map((se) => ({
        effectType: se.effectType,
        severity: se.severity,
        notes: se.notes || null,
      })) || [],
      activity: data.activity ? {
        workoutType: data.activity.workoutType || null,
        durationMinutes: data.activity.durationMinutes || null,
        steps: data.activity.steps || null,
        notes: data.activity.notes || null,
      } : null,
      mental: data.mental ? {
        motivationLevel: data.mental.motivationLevel || null,
        cravingsLevel: data.mental.cravingsLevel || null,
        moodLevel: data.mental.moodLevel || null,
        notes: data.mental.notes || null,
      } : null,
      diet: data.diet ? {
        hungerLevel: data.diet.hungerLevel || null,
        mealsCount: data.diet.mealsCount || null,
        proteinGrams: data.diet.proteinGrams || null,
        waterLiters: data.diet.waterLiters || null,
        notes: data.diet.notes || null,
      } : null,
      createdAt: dailyLog.createdAt,
      updatedAt: new Date(),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/daily-logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
