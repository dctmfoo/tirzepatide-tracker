import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET /api/push/status - Check if user has any push subscriptions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: eq(schema.pushSubscriptions.userId, session.user.id),
      columns: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      isSubscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        // Only return partial endpoint for privacy
        endpointPreview: s.endpoint.substring(0, 50) + '...',
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/push/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
