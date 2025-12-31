import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for profile updates
const updateProfileSchema = z.object({
  age: z.number().int().min(18).max(120).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  startingWeightKg: z.number().min(30).max(500).optional(),
  goalWeightKg: z.number().min(30).max(500).optional(),
  treatmentStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  preferredInjectionDay: z.number().int().min(0).max(6).nullable().optional(),
  reminderDaysBefore: z.number().int().min(0).max(7).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: profile.id,
      age: profile.age,
      gender: profile.gender,
      heightCm: Number(profile.heightCm),
      startingWeightKg: Number(profile.startingWeightKg),
      goalWeightKg: Number(profile.goalWeightKg),
      treatmentStartDate: profile.treatmentStartDate,
      preferredInjectionDay: profile.preferredInjectionDay,
      reminderDaysBefore: profile.reminderDaysBefore,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error('GET /api/profile error:', error);
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
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if profile exists
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, session.user.id),
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.heightCm !== undefined) updateData.heightCm = data.heightCm.toString();
    if (data.startingWeightKg !== undefined) updateData.startingWeightKg = data.startingWeightKg.toString();
    if (data.goalWeightKg !== undefined) updateData.goalWeightKg = data.goalWeightKg.toString();
    if (data.treatmentStartDate !== undefined) updateData.treatmentStartDate = data.treatmentStartDate;
    if (data.preferredInjectionDay !== undefined) updateData.preferredInjectionDay = data.preferredInjectionDay;
    if (data.reminderDaysBefore !== undefined) updateData.reminderDaysBefore = data.reminderDaysBefore;

    const [updatedProfile] = await db
      .update(schema.profiles)
      .set(updateData)
      .where(eq(schema.profiles.userId, session.user.id))
      .returning();

    return NextResponse.json({
      id: updatedProfile.id,
      age: updatedProfile.age,
      gender: updatedProfile.gender,
      heightCm: Number(updatedProfile.heightCm),
      startingWeightKg: Number(updatedProfile.startingWeightKg),
      goalWeightKg: Number(updatedProfile.goalWeightKg),
      treatmentStartDate: updatedProfile.treatmentStartDate,
      preferredInjectionDay: updatedProfile.preferredInjectionDay,
      reminderDaysBefore: updatedProfile.reminderDaysBefore,
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
