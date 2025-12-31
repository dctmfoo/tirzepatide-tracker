import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, desc, asc } from 'drizzle-orm';

export const runtime = 'edge';

// GET /api/export/image - Generate shareable progress image
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user data
    const [profile, weightEntries, injections] = await Promise.all([
      db.query.profiles.findFirst({
        where: eq(schema.profiles.userId, session.user.id),
      }),
      db
        .select()
        .from(schema.weightEntries)
        .where(eq(schema.weightEntries.userId, session.user.id))
        .orderBy(asc(schema.weightEntries.recordedAt)),
      db
        .select()
        .from(schema.injections)
        .where(eq(schema.injections.userId, session.user.id))
        .orderBy(desc(schema.injections.injectionDate)),
    ]);

    // Calculate stats
    const startingWeight = profile ? Number(profile.startingWeightKg) : null;
    const goalWeight = profile ? Number(profile.goalWeightKg) : null;
    const currentWeight = weightEntries.length > 0 ? Number(weightEntries[weightEntries.length - 1].weightKg) : null;
    const totalLost = startingWeight && currentWeight ? startingWeight - currentWeight : 0;

    // Calculate progress percentage
    let progressPercent = 0;
    if (startingWeight && goalWeight && currentWeight) {
      const totalToLose = startingWeight - goalWeight;
      const lostSoFar = startingWeight - currentWeight;
      progressPercent = totalToLose > 0 ? Math.min(100, Math.max(0, (lostSoFar / totalToLose) * 100)) : 0;
    }

    // Calculate treatment weeks
    let treatmentWeeks = 0;
    if (profile?.treatmentStartDate) {
      const startDate = new Date(profile.treatmentStartDate);
      const now = new Date();
      treatmentWeeks = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    }

    const currentDose = injections.length > 0 ? Number(injections[0].doseMg) : null;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0a',
            padding: '40px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#00d4ff',
              }}
            >
              Mounjaro Tracker
            </div>
          </div>

          {/* Main Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '30px',
            }}
          >
            {/* Weight Lost */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a2a3a',
                borderRadius: '16px',
                padding: '24px',
                flex: 1,
                marginRight: '16px',
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Total Lost
              </div>
              <div style={{ color: '#22c55e', fontSize: '48px', fontWeight: 'bold' }}>
                {totalLost > 0 ? `-${totalLost.toFixed(1)}` : totalLost.toFixed(1)} kg
              </div>
            </div>

            {/* Current Weight */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a2a3a',
                borderRadius: '16px',
                padding: '24px',
                flex: 1,
                marginRight: '16px',
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Current Weight
              </div>
              <div style={{ color: '#ffffff', fontSize: '48px', fontWeight: 'bold' }}>
                {currentWeight?.toFixed(1) || '--'} kg
              </div>
            </div>

            {/* Progress */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a2a3a',
                borderRadius: '16px',
                padding: '24px',
                flex: 1,
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                Goal Progress
              </div>
              <div style={{ color: '#00d4ff', fontSize: '48px', fontWeight: 'bold' }}>
                {progressPercent.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Treatment Info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a2a3a',
                borderRadius: '16px',
                padding: '20px',
                flex: 1,
                marginRight: '16px',
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Treatment Duration</div>
              <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                {treatmentWeeks} weeks
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a2a3a',
                borderRadius: '16px',
                padding: '20px',
                flex: 1,
                marginRight: '16px',
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Current Dose</div>
              <div style={{ color: '#a855f7', fontSize: '24px', fontWeight: 'bold' }}>
                {currentDose || '--'} mg
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1a2a3a',
                borderRadius: '16px',
                padding: '20px',
                flex: 1,
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Total Injections</div>
              <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' }}>
                {injections.length}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 400,
      }
    );
  } catch (error) {
    console.error('GET /api/export/image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
