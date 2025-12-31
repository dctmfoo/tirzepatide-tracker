import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { onboardingSchema } from '@/lib/validations/onboarding';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if profile already exists
    const existingProfile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, userId),
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists. Onboarding already completed.' },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = onboardingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Use a transaction to create all records atomically
    const [profile, preferences, weightEntry, injection] = await db.transaction(
      async (tx) => {
        // 1. Create profile
        const [newProfile] = await tx
          .insert(schema.profiles)
          .values({
            userId,
            age: data.age,
            gender: data.gender,
            heightCm: data.heightCm.toString(),
            startingWeightKg: data.startingWeightKg.toString(),
            goalWeightKg: data.goalWeightKg.toString(),
            treatmentStartDate: data.treatmentStartDate,
          })
          .returning();

        // 2. Create user preferences
        const [newPreferences] = await tx
          .insert(schema.userPreferences)
          .values({
            userId,
            weightUnit: data.weightUnit,
            heightUnit: data.heightUnit,
            dateFormat: 'DD/MM/YYYY',
            weekStartsOn: 1,
            theme: 'dark',
          })
          .returning();

        // 3. Create first weight entry (using starting weight)
        const [newWeightEntry] = await tx
          .insert(schema.weightEntries)
          .values({
            userId,
            weightKg: data.startingWeightKg.toString(),
            recordedAt: new Date(data.firstInjection.injectionDate),
            notes: 'Starting weight from onboarding',
          })
          .returning();

        // 4. Create first injection
        const [newInjection] = await tx
          .insert(schema.injections)
          .values({
            userId,
            doseMg: data.firstInjection.doseMg.toString(),
            injectionSite: data.firstInjection.injectionSite,
            injectionDate: new Date(data.firstInjection.injectionDate),
            notes: 'First injection from onboarding',
          })
          .returning();

        return [newProfile, newPreferences, newWeightEntry, newInjection];
      }
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        age: profile.age,
        gender: profile.gender,
      },
      preferences: {
        id: preferences.id,
        weightUnit: preferences.weightUnit,
        heightUnit: preferences.heightUnit,
      },
      weightEntry: {
        id: weightEntry.id,
        weightKg: weightEntry.weightKg,
        recordedAt: weightEntry.recordedAt,
      },
      injection: {
        id: injection.id,
        doseMg: injection.doseMg,
        injectionSite: injection.injectionSite,
        injectionDate: injection.injectionDate,
      },
      redirectTo: '/summary',
    });
  } catch (error) {
    console.error('POST /api/onboarding/complete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
