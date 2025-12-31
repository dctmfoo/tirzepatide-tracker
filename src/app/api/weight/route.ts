import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating weight entry
const createWeightSchema = z.object({
  weightKg: z.number().min(20).max(500),
  recordedAt: z.string().datetime().optional(), // ISO datetime, defaults to now
  notes: z.string().max(500).optional(),
});

// GET /api/weight - List weight entries with pagination and date filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [eq(schema.weightEntries.userId, session.user.id)];

    if (startDate) {
      conditions.push(gte(schema.weightEntries.recordedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(schema.weightEntries.recordedAt, new Date(endDate)));
    }

    const entries = await db
      .select()
      .from(schema.weightEntries)
      .where(and(...conditions))
      .orderBy(desc(schema.weightEntries.recordedAt))
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedEntries = entries.map((entry) => ({
      id: entry.id,
      weightKg: Number(entry.weightKg),
      recordedAt: entry.recordedAt,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    return NextResponse.json({
      entries: formattedEntries,
      pagination: {
        limit,
        offset,
        hasMore: entries.length === limit,
      },
    });
  } catch (error) {
    console.error('GET /api/weight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/weight - Create new weight entry
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createWeightSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const [entry] = await db
      .insert(schema.weightEntries)
      .values({
        userId: session.user.id,
        weightKg: data.weightKg.toString(),
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        id: entry.id,
        weightKg: Number(entry.weightKg),
        recordedAt: entry.recordedAt,
        notes: entry.notes,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/weight error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
