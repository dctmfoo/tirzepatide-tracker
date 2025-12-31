import { verifySessionForOnboarding } from '@/lib/dal';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify session and redirect to summary if onboarding already complete
  await verifySessionForOnboarding();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">{children}</div>
    </div>
  );
}
