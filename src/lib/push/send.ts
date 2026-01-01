import webpush, { WebPushError } from 'web-push';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Configure VAPID keys
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:notifications@mounjaro-tracker.com';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

// Initialize web-push with VAPID credentials
if (isPushConfigured()) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

type SendPushResult = {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
};

/**
 * Send push notification to a specific user
 * Sends to all their registered devices
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<SendPushResult> {
  const result: SendPushResult = {
    success: false,
    sent: 0,
    failed: 0,
    errors: [],
  };

  if (!isPushConfigured()) {
    result.errors.push('Push notifications not configured');
    return result;
  }

  try {
    // Get all subscriptions for this user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(schema.pushSubscriptions.userId, userId),
    });

    if (subscriptions.length === 0) {
      result.errors.push('No push subscriptions for user');
      return result;
    }

    const payloadString = JSON.stringify(payload);

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payloadString
        );
        return { success: true, subscriptionId: sub.id };
      } catch (error) {
        // Handle expired/invalid subscriptions
        if (error instanceof WebPushError) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or invalid - remove it
            await db
              .delete(schema.pushSubscriptions)
              .where(eq(schema.pushSubscriptions.id, sub.id));
            return {
              success: false,
              subscriptionId: sub.id,
              error: 'Subscription expired - removed',
            };
          }
        }
        return {
          success: false,
          subscriptionId: sub.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(sendPromises);

    for (const res of results) {
      if (res.success) {
        result.sent++;
      } else {
        result.failed++;
        if (res.error) {
          result.errors.push(res.error);
        }
      }
    }

    result.success = result.sent > 0;
    return result;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Send injection reminder push notification
 */
export async function sendInjectionReminderPush(
  userId: string,
  daysUntilDue: number,
  dueDate: string,
  currentDose: string
): Promise<SendPushResult> {
  const isOverdue = daysUntilDue < 0;
  const daysText = Math.abs(daysUntilDue);

  let title: string;
  let body: string;

  if (isOverdue) {
    title = 'Injection Overdue';
    body = `Your ${currentDose} injection was due ${daysText} day${daysText !== 1 ? 's' : ''} ago. Don't forget to log it!`;
  } else if (daysUntilDue === 0) {
    title = 'Injection Due Today';
    body = `Your ${currentDose} injection is due today. Tap to log it.`;
  } else {
    title = 'Injection Reminder';
    body = `Your ${currentDose} injection is due ${dueDate}. ${daysText} day${daysText !== 1 ? 's' : ''} remaining.`;
  }

  return sendPushNotification(userId, {
    title,
    body,
    url: '/jabs',
    tag: 'injection-reminder',
  });
}
