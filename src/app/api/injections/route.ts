import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { INJECTION_SITES } from '@/lib/utils/injection-logic';

// Valid Mounjaro doses in mg
const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;

// Validation schema for creating injection
const createInjectionSchema = z.object({
  doseMg: z.enum(VALID_DOSES),
  injectionSite: z.enum(INJECTION_SITES),
  injectionDate: z.string().datetime().optional(), // ISO datetime, defaults to now
  batchNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

// GET /api/injections - List all injections
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const injections = await db
      .select()
      .from(schema.injections)
      .where(eq(schema.injections.userId, session.user.id))
      .orderBy(desc(schema.injections.injectionDate))
      .limit(limit)
      .offset(offset);

    const formattedInjections = injections.map((inj) => ({
      id: inj.id,
      doseMg: Number(inj.doseMg),
      injectionSite: inj.injectionSite,
      injectionDate: inj.injectionDate,
      batchNumber: inj.batchNumber,
      notes: inj.notes,
      createdAt: inj.createdAt,
      updatedAt: inj.updatedAt,
    }));

    return NextResponse.json({
      injections: formattedInjections,
      pagination: {
        limit,
        offset,
        hasMore: injections.length === limit,
      },
    });
  } catch (error) {
    console.error('GET /api/injections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/injections - Create new injection
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createInjectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const [injection] = await db
      .insert(schema.injections)
      .values({
        userId: session.user.id,
        doseMg: data.doseMg,
        injectionSite: data.injectionSite,
        injectionDate: data.injectionDate ? new Date(data.injectionDate) : new Date(),
        batchNumber: data.batchNumber || null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        id: injection.id,
        doseMg: Number(injection.doseMg),
        injectionSite: injection.injectionSite,
        injectionDate: injection.injectionDate,
        batchNumber: injection.batchNumber,
        notes: injection.notes,
        createdAt: injection.createdAt,
        updatedAt: injection.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/injections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
