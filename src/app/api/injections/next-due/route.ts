import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// Standard injection interval (weekly)
const INJECTION_INTERVAL_DAYS = 7;

// GET /api/injections/next-due - Get next due date and status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get most recent injection
    const lastInjection = await db.query.injections.findFirst({
      where: eq(schema.injections.userId, session.user.id),
      orderBy: [desc(schema.injections.injectionDate)],
    });

    // Get user profile for preferred injection day
    const profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, session.user.id),
    });

    if (!lastInjection) {
      // No previous injections - next due is ASAP or treatment start date
      const treatmentStart = profile?.treatmentStartDate
        ? new Date(profile.treatmentStartDate)
        : new Date();

      return NextResponse.json({
        nextDueDate: treatmentStart,
        daysUntilDue: Math.max(0, Math.ceil((treatmentStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        status: 'not_started',
        lastInjection: null,
        preferredDay: profile?.preferredInjectionDay ?? null,
      });
    }

    // Calculate next due date (7 days after last injection)
    const lastDate = new Date(lastInjection.injectionDate);
    const nextDueDate = new Date(lastDate);
    nextDueDate.setDate(nextDueDate.getDate() + INJECTION_INTERVAL_DAYS);

    const now = new Date();
    const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Determine status
    let status: 'on_track' | 'due_today' | 'due_soon' | 'overdue';
    if (daysUntilDue < 0) {
      status = 'overdue';
    } else if (daysUntilDue === 0) {
      status = 'due_today';
    } else if (daysUntilDue <= 2) {
      status = 'due_soon';
    } else {
      status = 'on_track';
    }

    // Calculate days since last injection
    const daysSinceLastInjection = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      nextDueDate,
      daysUntilDue,
      status,
      lastInjection: {
        id: lastInjection.id,
        doseMg: Number(lastInjection.doseMg),
        injectionDate: lastInjection.injectionDate,
        daysSince: daysSinceLastInjection,
      },
      preferredDay: profile?.preferredInjectionDay ?? null,
    });
  } catch (error) {
    console.error('GET /api/injections/next-due error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
