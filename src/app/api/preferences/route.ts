import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for preferences updates
const updatePreferencesSchema = z.object({
  weightUnit: z.enum(['kg', 'lbs', 'stone']).optional(),
  heightUnit: z.enum(['cm', 'ft-in']).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  weekStartsOn: z.number().int().min(0).max(6).optional(),
  theme: z.enum(['dark', 'light']).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await db.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, session.user.id),
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      const [newPreferences] = await db
        .insert(schema.userPreferences)
        .values({
          userId: session.user.id,
          weightUnit: 'kg',
          heightUnit: 'cm',
          dateFormat: 'DD/MM/YYYY',
          weekStartsOn: 1,
          theme: 'dark',
        })
        .returning();
      preferences = newPreferences;
    }

    return NextResponse.json({
      id: preferences.id,
      weightUnit: preferences.weightUnit,
      heightUnit: preferences.heightUnit,
      dateFormat: preferences.dateFormat,
      weekStartsOn: preferences.weekStartsOn,
      theme: preferences.theme,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const data = validationResult.data;

    // Check if preferences exist
    const existingPreferences = await db.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, session.user.id),
    });

    let updatedPreferences;

    if (!existingPreferences) {
      // Create preferences with provided values + defaults
      [updatedPreferences] = await db
        .insert(schema.userPreferences)
        .values({
          userId: session.user.id,
          weightUnit: data.weightUnit ?? 'kg',
          heightUnit: data.heightUnit ?? 'cm',
          dateFormat: data.dateFormat ?? 'DD/MM/YYYY',
          weekStartsOn: data.weekStartsOn ?? 1,
          theme: data.theme ?? 'dark',
        })
        .returning();
    } else {
      // Build update object with only provided fields
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.weightUnit !== undefined) updateData.weightUnit = data.weightUnit;
      if (data.heightUnit !== undefined) updateData.heightUnit = data.heightUnit;
      if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat;
      if (data.weekStartsOn !== undefined) updateData.weekStartsOn = data.weekStartsOn;
      if (data.theme !== undefined) updateData.theme = data.theme;

      [updatedPreferences] = await db
        .update(schema.userPreferences)
        .set(updateData)
        .where(eq(schema.userPreferences.userId, session.user.id))
        .returning();
    }

    return NextResponse.json({
      id: updatedPreferences.id,
      weightUnit: updatedPreferences.weightUnit,
      heightUnit: updatedPreferences.heightUnit,
      dateFormat: updatedPreferences.dateFormat,
      weekStartsOn: updatedPreferences.weekStartsOn,
      theme: updatedPreferences.theme,
      createdAt: updatedPreferences.createdAt,
      updatedAt: updatedPreferences.updatedAt,
    });
  } catch (error) {
    console.error('PUT /api/preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
