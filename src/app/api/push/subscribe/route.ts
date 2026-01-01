import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Schema for push subscription from browser
const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// POST /api/push/subscribe - Save push subscription
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = pushSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { endpoint, keys } = result.data;

    // Check if subscription already exists
    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(schema.pushSubscriptions.endpoint, endpoint),
    });

    if (existing) {
      // Update existing subscription (may have new keys or different user)
      await db
        .update(schema.pushSubscriptions)
        .set({
          userId: session.user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          updatedAt: new Date(),
        })
        .where(eq(schema.pushSubscriptions.endpoint, endpoint));

      return NextResponse.json({ success: true, message: 'Subscription updated' });
    }

    // Create new subscription
    await db.insert(schema.pushSubscriptions).values({
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ success: true, message: 'Subscription created' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/push/subscribe - Remove push subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    // Only delete subscriptions belonging to this user
    const deleted = await db
      .delete(schema.pushSubscriptions)
      .where(
        and(
          eq(schema.pushSubscriptions.userId, session.user.id),
          eq(schema.pushSubscriptions.endpoint, endpoint)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Subscription removed' });
  } catch (error) {
    console.error('DELETE /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
