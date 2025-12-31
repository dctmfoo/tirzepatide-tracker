import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Available notification types
const NOTIFICATION_TYPES = [
  'injection_reminder',
  'weight_reminder',
  'weekly_summary',
  'milestone_reached',
] as const;

// Validation schema
const updatePreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      notificationType: z.enum(NOTIFICATION_TYPES),
      enabled: z.boolean(),
    })
  ),
});

// GET /api/notifications/preferences - Get all notification preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing preferences
    const existingPrefs = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, session.user.id));

    // Build complete preferences map with defaults
    const prefsMap = new Map(existingPrefs.map((p) => [p.notificationType, p.enabled]));

    const allPreferences = NOTIFICATION_TYPES.map((type) => ({
      notificationType: type,
      enabled: prefsMap.has(type) ? prefsMap.get(type) : true, // Default to enabled
      description: getNotificationDescription(type),
    }));

    return NextResponse.json({
      preferences: allPreferences,
    });
  } catch (error) {
    console.error('GET /api/notifications/preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updatePreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { preferences } = validationResult.data;

    // Upsert each preference
    for (const pref of preferences) {
      const existing = await db.query.notificationPreferences.findFirst({
        where: and(
          eq(schema.notificationPreferences.userId, session.user.id),
          eq(schema.notificationPreferences.notificationType, pref.notificationType)
        ),
      });

      if (existing) {
        await db
          .update(schema.notificationPreferences)
          .set({
            enabled: pref.enabled,
            updatedAt: new Date(),
          })
          .where(eq(schema.notificationPreferences.id, existing.id));
      } else {
        await db.insert(schema.notificationPreferences).values({
          userId: session.user.id,
          notificationType: pref.notificationType,
          enabled: pref.enabled,
        });
      }
    }

    // Return updated preferences
    const updatedPrefs = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, session.user.id));

    const prefsMap = new Map(updatedPrefs.map((p) => [p.notificationType, p.enabled]));

    const allPreferences = NOTIFICATION_TYPES.map((type) => ({
      notificationType: type,
      enabled: prefsMap.has(type) ? prefsMap.get(type) : true,
      description: getNotificationDescription(type),
    }));

    return NextResponse.json({
      preferences: allPreferences,
    });
  } catch (error) {
    console.error('PUT /api/notifications/preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getNotificationDescription(type: string): string {
  switch (type) {
    case 'injection_reminder':
      return 'Reminder before your next scheduled injection';
    case 'weight_reminder':
      return 'Daily reminder to log your weight';
    case 'weekly_summary':
      return 'Weekly progress summary email';
    case 'milestone_reached':
      return 'Notification when you reach a weight milestone';
    default:
      return '';
  }
}
