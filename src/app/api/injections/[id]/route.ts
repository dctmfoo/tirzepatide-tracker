import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Valid Mounjaro doses in mg
const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;

// Valid injection sites
const VALID_SITES = ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'] as const;

// Validation schema for updating injection
const updateInjectionSchema = z.object({
  doseMg: z.enum(VALID_DOSES).optional(),
  injectionSite: z.enum(VALID_SITES).optional(),
  injectionDate: z.string().datetime().optional(),
  batchNumber: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/injections/[id] - Get single injection
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const injection = await db.query.injections.findFirst({
      where: and(
        eq(schema.injections.id, id),
        eq(schema.injections.userId, session.user.id)
      ),
    });

    if (!injection) {
      return NextResponse.json({ error: 'Injection not found' }, { status: 404 });
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
    console.error('GET /api/injections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/injections/[id] - Update injection
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validationResult = updateInjectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Check if injection exists and belongs to user
    const existingInjection = await db.query.injections.findFirst({
      where: and(
        eq(schema.injections.id, id),
        eq(schema.injections.userId, session.user.id)
      ),
    });

    if (!existingInjection) {
      return NextResponse.json({ error: 'Injection not found' }, { status: 404 });
    }

    const data = validationResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.doseMg !== undefined) updateData.doseMg = data.doseMg;
    if (data.injectionSite !== undefined) updateData.injectionSite = data.injectionSite;
    if (data.injectionDate !== undefined) updateData.injectionDate = new Date(data.injectionDate);
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedInjection] = await db
      .update(schema.injections)
      .set(updateData)
      .where(
        and(
          eq(schema.injections.id, id),
          eq(schema.injections.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({
      id: updatedInjection.id,
      doseMg: Number(updatedInjection.doseMg),
      injectionSite: updatedInjection.injectionSite,
      injectionDate: updatedInjection.injectionDate,
      batchNumber: updatedInjection.batchNumber,
      notes: updatedInjection.notes,
      createdAt: updatedInjection.createdAt,
      updatedAt: updatedInjection.updatedAt,
    });
  } catch (error) {
    console.error('PUT /api/injections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/injections/[id] - Delete injection
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if injection exists and belongs to user
    const existingInjection = await db.query.injections.findFirst({
      where: and(
        eq(schema.injections.id, id),
        eq(schema.injections.userId, session.user.id)
      ),
    });

    if (!existingInjection) {
      return NextResponse.json({ error: 'Injection not found' }, { status: 404 });
    }

    await db
      .delete(schema.injections)
      .where(
        and(
          eq(schema.injections.id, id),
          eq(schema.injections.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/injections/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
