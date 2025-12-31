import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// GET /api/injections/latest - Get most recent injection
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const injection = await db.query.injections.findFirst({
      where: eq(schema.injections.userId, session.user.id),
      orderBy: [desc(schema.injections.injectionDate)],
    });

    if (!injection) {
      return NextResponse.json({ error: 'No injections found' }, { status: 404 });
    }

    return NextResponse.json({
      id: injection.id,
      doseMg: Number(injection.doseMg),
      injectionSite: injection.injectionSite,
      injectionDate: injection.injectionDate,
      batchNumber: injection.batchNumber,
      notes: injection.notes,
      createdAt: injection.createdAt,
      updatedAt: injection.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/injections/latest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
