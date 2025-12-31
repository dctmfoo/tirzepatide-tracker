import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user has completed onboarding
  const profile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, session.user.id),
  });

  // Redirect to onboarding if profile doesn't exist
  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
