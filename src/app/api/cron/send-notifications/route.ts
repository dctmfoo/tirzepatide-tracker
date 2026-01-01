import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import {
  sendEmail,
  isEmailConfigured,
  injectionReminderTemplate,
  injectionOverdueTemplate,
  weightReminderTemplate,
  weeklySummaryTemplate,
} from '@/lib/email';
import { sendInjectionReminderPush, isPushConfigured } from '@/lib/push/send';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

type NotificationResults = {
  injectionReminders: number;
  injectionOverdue: number;
  weightReminders: number;
  weeklySummaries: number;
  pushNotifications: number;
  errors: string[];
};

// POST /api/cron/send-notifications - Cron endpoint for sending scheduled notifications
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: NotificationResults = {
      injectionReminders: 0,
      injectionOverdue: 0,
      weightReminders: 0,
      weeklySummaries: 0,
      pushNotifications: 0,
      errors: [],
    };

    // Get all users with their profiles and notification preferences
    const users = await db.query.users.findMany({
      with: {
        profile: true,
        preferences: true,
        notificationPreferences: true,
      },
    });

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const isSunday = now.getDay() === 0;

    for (const user of users) {
      if (!user.profile) continue;

      // Build notification preferences map
      const notifPrefs = new Map(
        user.notificationPreferences.map((p) => [p.notificationType, p.enabled])
      );

      // Check injection reminders and overdue
      if (notifPrefs.get('injection_reminder') !== false) {
        try {
          await checkInjectionNotifications(user, results);
        } catch (error) {
          results.errors.push(`Injection notification failed for ${user.email}: ${error}`);
        }
      }

      // Check weight reminders (only if they haven't logged today and it's after noon)
      if (notifPrefs.get('weight_reminder') !== false && now.getHours() >= 12) {
        try {
          await checkWeightReminder(user, today, results);
        } catch (error) {
          results.errors.push(`Weight reminder failed for ${user.email}: ${error}`);
        }
      }

      // Check weekly summaries (on Sundays)
      if (notifPrefs.get('weekly_summary') !== false && isSunday) {
        try {
          await sendWeeklySummary(user, results);
        } catch (error) {
          results.errors.push(`Weekly summary failed for ${user.email}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      emailConfigured: isEmailConfigured(),
      pushConfigured: isPushConfigured(),
      results,
    });
  } catch (error) {
    console.error('POST /api/cron/send-notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

type UserWithProfile = {
  id: string;
  email: string;
  profile: { reminderDaysBefore: number | null } | null;
};

async function checkInjectionNotifications(
  user: UserWithProfile,
  results: NotificationResults
) {
  // Get last injection
  const lastInjection = await db.query.injections.findFirst({
    where: eq(schema.injections.userId, user.id),
    orderBy: [desc(schema.injections.injectionDate)],
  });

  if (!lastInjection) return;

  const lastDate = new Date(lastInjection.injectionDate);
  const nextDue = new Date(lastDate);
  nextDue.setDate(nextDue.getDate() + 7);

  const now = new Date();
  const msUntilDue = nextDue.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(msUntilDue / (1000 * 60 * 60 * 24));
  const reminderDays = user.profile?.reminderDaysBefore ?? 1;
  const currentDose = `${Number(lastInjection.doseMg)}mg`;
  const dueDateFormatted = nextDue.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Check if reminder should be sent
  if (daysUntilDue === reminderDays && daysUntilDue > 0) {
    const template = injectionReminderTemplate({
      daysUntilDue,
      dueDate: dueDateFormatted,
      currentDose,
    });

    // Send email notification
    await sendAndLogEmail(user.id, user.email, 'injection_reminder', template);
    results.injectionReminders++;

    // Send push notification
    const pushResult = await sendInjectionReminderPush(
      user.id,
      daysUntilDue,
      dueDateFormatted,
      currentDose
    );
    if (pushResult.sent > 0) {
      results.pushNotifications += pushResult.sent;
    }
  }

  // Check if overdue notification should be sent (1-3 days overdue)
  if (daysUntilDue < 0 && daysUntilDue >= -3) {
    const daysOverdue = Math.abs(daysUntilDue);
    const template = injectionOverdueTemplate({
      daysOverdue,
      lastInjectionDate: lastDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    });

    // Send email notification
    await sendAndLogEmail(user.id, user.email, 'injection_overdue', template);
    results.injectionOverdue++;

    // Send push notification for overdue
    const pushResult = await sendInjectionReminderPush(
      user.id,
      daysUntilDue,
      dueDateFormatted,
      currentDose
    );
    if (pushResult.sent > 0) {
      results.pushNotifications += pushResult.sent;
    }
  }
}

async function checkWeightReminder(
  user: { id: string; email: string },
  today: string,
  results: NotificationResults
) {
  const lastWeight = await db.query.weightEntries.findFirst({
    where: eq(schema.weightEntries.userId, user.id),
    orderBy: [desc(schema.weightEntries.recordedAt)],
  });

  if (!lastWeight) return;

  const lastDate = new Date(lastWeight.recordedAt).toISOString().split('T')[0];

  // Only send if no weight logged today
  if (lastDate !== today) {
    const template = weightReminderTemplate({
      lastWeight: `${Number(lastWeight.weightKg).toFixed(1)} kg`,
      lastDate: new Date(lastWeight.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });

    await sendAndLogEmail(user.id, user.email, 'weight_reminder', template);
    results.weightReminders++;
  }
}

async function sendWeeklySummary(
  user: { id: string; email: string },
  results: NotificationResults
) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [weights, injections] = await Promise.all([
    db
      .select()
      .from(schema.weightEntries)
      .where(eq(schema.weightEntries.userId, user.id))
      .orderBy(desc(schema.weightEntries.recordedAt)),
    db
      .select()
      .from(schema.injections)
      .where(eq(schema.injections.userId, user.id))
      .orderBy(desc(schema.injections.injectionDate)),
  ]);

  const weekWeights = weights.filter((w) => new Date(w.recordedAt) >= weekAgo);
  const weekInjections = injections.filter((i) => new Date(i.injectionDate) >= weekAgo);

  const startWeight = weekWeights.length > 0 ? Number(weekWeights[weekWeights.length - 1].weightKg) : null;
  const endWeight = weekWeights.length > 0 ? Number(weekWeights[0].weightKg) : null;
  const weeklyChange = startWeight && endWeight ? endWeight - startWeight : null;

  const now = new Date();
  const weekStart = new Date(weekAgo);

  const template = weeklySummaryTemplate({
    weekStartDate: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekEndDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weightEntries: weekWeights.length,
    injectionsCount: weekInjections.length,
    startWeight: startWeight ? `${startWeight.toFixed(1)} kg` : undefined,
    endWeight: endWeight ? `${endWeight.toFixed(1)} kg` : undefined,
    weeklyChange: weeklyChange !== null ? `${Math.abs(weeklyChange).toFixed(1)} kg` : undefined,
    changeDirection: weeklyChange === null ? undefined : weeklyChange < 0 ? 'down' : weeklyChange > 0 ? 'up' : 'same',
  });

  await sendAndLogEmail(user.id, user.email, 'weekly_summary', template);
  results.weeklySummaries++;
}

async function sendAndLogEmail(
  userId: string,
  email: string,
  notificationType: string,
  template: { subject: string; html: string }
) {
  const result = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });

  // If email not configured (dev mode), result is null
  if (result === null) {
    return;
  }

  // Log the email
  await db.insert(schema.emailLogs).values({
    userId,
    notificationType,
    status: result.success ? 'sent' : 'failed',
    resendId: result.id || null,
    errorMessage: result.error || null,
  });

  if (!result.success) {
    throw new Error(result.error);
  }
}
