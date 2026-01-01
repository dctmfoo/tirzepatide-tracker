import { verifySessionWithProfile } from '@/lib/dal';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify session and profile using DAL (redirects if invalid)
  await verifySessionWithProfile();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-2xl flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
