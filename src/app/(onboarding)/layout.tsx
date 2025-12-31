import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user already has a profile (onboarding complete)
  const profile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, session.user.id),
  });

  if (profile) {
    // Already completed onboarding, go to summary
    redirect('/summary');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
