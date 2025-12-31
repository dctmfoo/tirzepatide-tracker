import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// POST /api/cron/send-notifications - Cron endpoint for sending scheduled notifications
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      injectionReminders: 0,
      weightReminders: 0,
      weeklySummaries: 0,
      errors: [] as string[],
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

    for (const user of users) {
      if (!user.profile) continue;

      // Build notification preferences map
      const notifPrefs = new Map(
        user.notificationPreferences.map((p) => [p.notificationType, p.enabled])
      );

      // Check injection reminders
      if (notifPrefs.get('injection_reminder') !== false) {
        try {
          await checkInjectionReminder(user, results);
        } catch (error) {
          results.errors.push(`Injection reminder failed for ${user.email}: ${error}`);
        }
      }

      // Check weight reminders (only if they haven't logged today)
      if (notifPrefs.get('weight_reminder') !== false) {
        try {
          await checkWeightReminder(user, today, results);
        } catch (error) {
          results.errors.push(`Weight reminder failed for ${user.email}: ${error}`);
        }
      }

      // Check weekly summaries (on Sundays)
      if (notifPrefs.get('weekly_summary') !== false && now.getDay() === 0) {
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
      results,
    });
  } catch (error) {
    console.error('POST /api/cron/send-notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkInjectionReminder(
  user: { id: string; email: string; profile: { reminderDaysBefore: number | null } | null },
  results: { injectionReminders: number }
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
  const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const reminderDays = user.profile?.reminderDaysBefore ?? 1;

  if (daysUntilDue === reminderDays) {
    await sendEmail(user.id, user.email, 'injection_reminder', {
      subject: 'Injection Reminder - Mounjaro Tracker',
      html: `
        <h2>Injection Reminder</h2>
        <p>Your next Mounjaro injection is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}.</p>
        <p>Scheduled date: ${nextDue.toLocaleDateString()}</p>
      `,
    });
    results.injectionReminders++;
  }
}

async function checkWeightReminder(
  user: { id: string; email: string },
  today: string,
  results: { weightReminders: number }
) {
  // If no weight logged today and it's after noon
  const now = new Date();
  if (now.getHours() >= 12) {
    const lastWeight = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, user.id),
      orderBy: [desc(schema.weightEntries.recordedAt)],
    });

    if (lastWeight) {
      const lastDate = new Date(lastWeight.recordedAt).toISOString().split('T')[0];
      if (lastDate !== today) {
        await sendEmail(user.id, user.email, 'weight_reminder', {
          subject: 'Weight Reminder - Mounjaro Tracker',
          html: `
            <h2>Daily Weight Reminder</h2>
            <p>Don't forget to log your weight today!</p>
            <p>Last recorded: ${lastWeight.recordedAt.toLocaleDateString()} - ${Number(lastWeight.weightKg).toFixed(1)} kg</p>
          `,
        });
        results.weightReminders++;
      }
    }
  }
}

async function sendWeeklySummary(
  user: { id: string; email: string },
  results: { weeklySummaries: number }
) {
  // Get last 7 days of data
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [weights, injections] = await Promise.all([
    db
      .select()
      .from(schema.weightEntries)
      .where(
        and(
          eq(schema.weightEntries.userId, user.id),
          // gte would be used here for date filtering
        )
      )
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

  await sendEmail(user.id, user.email, 'weekly_summary', {
    subject: 'Weekly Summary - Mounjaro Tracker',
    html: `
      <h2>Your Weekly Summary</h2>
      <p><strong>Weight Entries:</strong> ${weekWeights.length}</p>
      <p><strong>Injections:</strong> ${weekInjections.length}</p>
      ${weeklyChange !== null ? `<p><strong>Weekly Change:</strong> ${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)} kg</p>` : ''}
      <p>Keep up the great work!</p>
    `,
  });
  results.weeklySummaries++;
}

async function sendEmail(
  userId: string,
  email: string,
  notificationType: string,
  emailData: { subject: string; html: string }
) {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Would send ${notificationType} email to ${email}`);
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
      to: email,
      subject: emailData.subject,
      html: emailData.html,
    });

    // Log success
    await db.insert(schema.emailLogs).values({
      userId,
      notificationType,
      status: 'sent',
      resendId: result.data?.id || null,
    });
  } catch (error) {
    // Log failure
    await db.insert(schema.emailLogs).values({
      userId,
      notificationType,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
