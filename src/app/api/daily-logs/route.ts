import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const sideEffectSchema = z.object({
  effectType: z.string().max(50),
  severity: z.enum(['None', 'Mild', 'Moderate', 'Severe']),
  notes: z.string().max(500).optional(),
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

    // Handle side effects
    if (data.sideEffects) {
      // Delete existing side effects for this log
      await db
        .delete(schema.sideEffects)
        .where(eq(schema.sideEffects.dailyLogId, dailyLog.id));

      // Insert new side effects
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
    if (data.activity) {
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
    if (data.mental) {
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
    if (data.diet) {
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

    // Fetch the complete log
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
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/daily-logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
