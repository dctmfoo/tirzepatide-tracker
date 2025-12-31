import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/weight/latest - Get most recent weight entry
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await db.query.weightEntries.findFirst({
      where: eq(schema.weightEntries.userId, session.user.id),
      orderBy: [desc(schema.weightEntries.recordedAt)],
    });

    if (!entry) {
      return NextResponse.json({ error: 'No weight entries found' }, { status: 404 });
    }

    return NextResponse.json({
      id: entry.id,
      weightKg: Number(entry.weightKg),
      recordedAt: entry.recordedAt,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/weight/latest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
