'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { verifySession } from '@/lib/dal';
import { db, schema } from '@/lib/db';

const VALID_DOSES = ['2.5', '5', '7.5', '10', '12.5', '15'] as const;
const VALID_SITES = ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'] as const;

const createInjectionSchema = z.object({
  doseMg: z.string().refine((val) => VALID_DOSES.includes(val as typeof VALID_DOSES[number]), {
    message: 'Invalid dose',
  }),
  injectionSite: z.enum(VALID_SITES),
  injectionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
  notes: z.string().optional(),
});

export type CreateInjectionResult = {
  success: boolean;
  error?: string;
};

export async function createInjection(formData: {
  doseMg: string;
  injectionSite: string;
  injectionDate: string;
  notes?: string;
}): Promise<CreateInjectionResult> {
  try {
    const session = await verifySession();

    const parsed = createInjectionSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid form data' };
    }

    await db.insert(schema.injections).values({
      userId: session.userId,
      doseMg: parsed.data.doseMg,
      injectionSite: parsed.data.injectionSite,
      injectionDate: new Date(parsed.data.injectionDate),
      notes: parsed.data.notes || null,
    });

    revalidatePath('/jabs');
    revalidatePath('/summary');
    revalidatePath('/calendar');

    return { success: true };
  } catch (error) {
    console.error('createInjection error:', error);
    return { success: false, error: 'Failed to save injection' };
  }
}
