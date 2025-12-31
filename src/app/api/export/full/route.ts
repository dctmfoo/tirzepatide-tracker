import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

// GET /api/export/full - GDPR-compliant full data export
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch ALL user data including metadata
    const [
      user,
      profile,
      preferences,
      weightEntries,
      injections,
      dailyLogs,
      notificationPreferences,
      emailLogs,
    ] = await Promise.all([
      db.query.users.findFirst({
        where: eq(schema.users.id, session.user.id),
      }),
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
      db
        .select()
        .from(schema.notificationPreferences)
        .where(eq(schema.notificationPreferences.userId, session.user.id)),
      db
        .select()
        .from(schema.emailLogs)
        .where(eq(schema.emailLogs.userId, session.user.id))
        .orderBy(asc(schema.emailLogs.sentAt)),
    ]);

    // Build comprehensive GDPR export
    const exportData = {
      _meta: {
        exportType: 'GDPR Full Data Export',
        exportedAt: new Date().toISOString(),
        dataController: 'Mounjaro Tracker',
        dataSubject: session.user.email,
        format: 'JSON',
        version: '1.0',
      },
      account: {
        id: user?.id,
        email: user?.email,
        emailVerified: user?.emailVerified,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      },
      profile: profile
        ? {
            id: profile.id,
            age: profile.age,
            gender: profile.gender,
            heightCm: Number(profile.heightCm),
            startingWeightKg: Number(profile.startingWeightKg),
            goalWeightKg: Number(profile.goalWeightKg),
            treatmentStartDate: profile.treatmentStartDate,
            preferredInjectionDay: profile.preferredInjectionDay,
            reminderDaysBefore: profile.reminderDaysBefore,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      preferences: preferences
        ? {
            id: preferences.id,
            weightUnit: preferences.weightUnit,
            heightUnit: preferences.heightUnit,
            dateFormat: preferences.dateFormat,
            weekStartsOn: preferences.weekStartsOn,
            theme: preferences.theme,
            createdAt: preferences.createdAt,
            updatedAt: preferences.updatedAt,
          }
        : null,
      weightEntries: weightEntries.map((w) => ({
        id: w.id,
        weightKg: Number(w.weightKg),
        recordedAt: w.recordedAt,
        notes: w.notes,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      injections: injections.map((inj) => ({
        id: inj.id,
        doseMg: Number(inj.doseMg),
        injectionSite: inj.injectionSite,
        injectionDate: inj.injectionDate,
        batchNumber: inj.batchNumber,
        notes: inj.notes,
        createdAt: inj.createdAt,
        updatedAt: inj.updatedAt,
      })),
      dailyLogs: dailyLogs.map((log) => ({
        id: log.id,
        logDate: log.logDate,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        sideEffects: log.sideEffects.map((se) => ({
          id: se.id,
          effectType: se.effectType,
          severity: se.severity,
          notes: se.notes,
          createdAt: se.createdAt,
        })),
        activityLog: log.activityLog
          ? {
              id: log.activityLog.id,
              workoutType: log.activityLog.workoutType,
              durationMinutes: log.activityLog.durationMinutes,
              steps: log.activityLog.steps,
              notes: log.activityLog.notes,
              createdAt: log.activityLog.createdAt,
            }
          : null,
        mentalLog: log.mentalLog
          ? {
              id: log.mentalLog.id,
              motivationLevel: log.mentalLog.motivationLevel,
              cravingsLevel: log.mentalLog.cravingsLevel,
              moodLevel: log.mentalLog.moodLevel,
              notes: log.mentalLog.notes,
              createdAt: log.mentalLog.createdAt,
            }
          : null,
        dietLog: log.dietLog
          ? {
              id: log.dietLog.id,
              hungerLevel: log.dietLog.hungerLevel,
              mealsCount: log.dietLog.mealsCount,
              proteinGrams: log.dietLog.proteinGrams,
              waterLiters: log.dietLog.waterLiters ? Number(log.dietLog.waterLiters) : null,
              notes: log.dietLog.notes,
              createdAt: log.dietLog.createdAt,
            }
          : null,
      })),
      notificationPreferences: notificationPreferences.map((np) => ({
        id: np.id,
        notificationType: np.notificationType,
        enabled: np.enabled,
        createdAt: np.createdAt,
        updatedAt: np.updatedAt,
      })),
      emailLogs: emailLogs.map((el) => ({
        id: el.id,
        notificationType: el.notificationType,
        sentAt: el.sentAt,
        status: el.status,
        resendId: el.resendId,
      })),
      _dataCounts: {
        weightEntries: weightEntries.length,
        injections: injections.length,
        dailyLogs: dailyLogs.length,
        notificationPreferences: notificationPreferences.length,
        emailsSent: emailLogs.length,
      },
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mounjaro-tracker-gdpr-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('GET /api/export/full error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
