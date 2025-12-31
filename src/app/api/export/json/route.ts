import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

// GET /api/export/json - Export all user data as JSON
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data
    const [profile, preferences, weightEntries, injections, dailyLogs] = await Promise.all([
      db.query.profiles.findFirst({
        where: eq(schema.profiles.userId, session.user.id),
      }),
      db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.userId, session.user.id),
      }),
      db
        .select()
        .from(schema.weightEntries)
        .where(eq(schema.weightEntries.userId, session.user.id))
        .orderBy(asc(schema.weightEntries.recordedAt)),
      db
        .select()
        .from(schema.injections)
        .where(eq(schema.injections.userId, session.user.id))
        .orderBy(asc(schema.injections.injectionDate)),
      db.query.dailyLogs.findMany({
        where: eq(schema.dailyLogs.userId, session.user.id),
        with: {
          sideEffects: true,
          activityLog: true,
          mentalLog: true,
          dietLog: true,
        },
        orderBy: [asc(schema.dailyLogs.logDate)],
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: session.user.email,
      },
      profile: profile
        ? {
            age: profile.age,
            gender: profile.gender,
            heightCm: Number(profile.heightCm),
            startingWeightKg: Number(profile.startingWeightKg),
            goalWeightKg: Number(profile.goalWeightKg),
            treatmentStartDate: profile.treatmentStartDate,
            preferredInjectionDay: profile.preferredInjectionDay,
            reminderDaysBefore: profile.reminderDaysBefore,
          }
        : null,
      preferences: preferences
        ? {
            weightUnit: preferences.weightUnit,
            heightUnit: preferences.heightUnit,
            dateFormat: preferences.dateFormat,
            weekStartsOn: preferences.weekStartsOn,
            theme: preferences.theme,
          }
        : null,
      weightEntries: weightEntries.map((w) => ({
        weightKg: Number(w.weightKg),
        recordedAt: w.recordedAt,
        notes: w.notes,
      })),
      injections: injections.map((inj) => ({
        doseMg: Number(inj.doseMg),
        injectionSite: inj.injectionSite,
        injectionDate: inj.injectionDate,
        batchNumber: inj.batchNumber,
        notes: inj.notes,
      })),
      dailyLogs: dailyLogs.map((log) => ({
        logDate: log.logDate,
        sideEffects: log.sideEffects.map((se) => ({
          effectType: se.effectType,
          severity: se.severity,
          notes: se.notes,
        })),
        activity: log.activityLog
          ? {
              workoutType: log.activityLog.workoutType,
              durationMinutes: log.activityLog.durationMinutes,
              steps: log.activityLog.steps,
              notes: log.activityLog.notes,
            }
          : null,
        mental: log.mentalLog
          ? {
              motivationLevel: log.mentalLog.motivationLevel,
              cravingsLevel: log.mentalLog.cravingsLevel,
              moodLevel: log.mentalLog.moodLevel,
              notes: log.mentalLog.notes,
            }
          : null,
        diet: log.dietLog
          ? {
              hungerLevel: log.dietLog.hungerLevel,
              mealsCount: log.dietLog.mealsCount,
              proteinGrams: log.dietLog.proteinGrams,
              waterLiters: log.dietLog.waterLiters ? Number(log.dietLog.waterLiters) : null,
              notes: log.dietLog.notes,
            }
          : null,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mounjaro-tracker-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('GET /api/export/json error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
