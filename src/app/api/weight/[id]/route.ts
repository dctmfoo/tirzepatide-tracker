import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for updating weight entry
const updateWeightSchema = z.object({
  weightKg: z.number().min(20).max(500).optional(),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/weight/[id] - Get single weight entry
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const entry = await db.query.weightEntries.findFirst({
      where: and(
        eq(schema.weightEntries.id, id),
        eq(schema.weightEntries.userId, session.user.id)
      ),
    });

    if (!entry) {
      return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 });
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
    console.error('GET /api/weight/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/weight/[id] - Update weight entry
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validationResult = updateWeightSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Check if entry exists and belongs to user
    const existingEntry = await db.query.weightEntries.findFirst({
      where: and(
        eq(schema.weightEntries.id, id),
        eq(schema.weightEntries.userId, session.user.id)
      ),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 });
    }

    const data = validationResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.weightKg !== undefined) updateData.weightKg = data.weightKg.toString();
    if (data.recordedAt !== undefined) updateData.recordedAt = new Date(data.recordedAt);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedEntry] = await db
      .update(schema.weightEntries)
      .set(updateData)
      .where(
        and(
          eq(schema.weightEntries.id, id),
          eq(schema.weightEntries.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({
      id: updatedEntry.id,
      weightKg: Number(updatedEntry.weightKg),
      recordedAt: updatedEntry.recordedAt,
      notes: updatedEntry.notes,
      createdAt: updatedEntry.createdAt,
      updatedAt: updatedEntry.updatedAt,
    });
  } catch (error) {
    console.error('PUT /api/weight/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/weight/[id] - Delete weight entry
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if entry exists and belongs to user
    const existingEntry = await db.query.weightEntries.findFirst({
      where: and(
        eq(schema.weightEntries.id, id),
        eq(schema.weightEntries.userId, session.user.id)
      ),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 });
    }

    await db
      .delete(schema.weightEntries)
      .where(
        and(
          eq(schema.weightEntries.id, id),
          eq(schema.weightEntries.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/weight/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
