import { verifySessionForOnboarding } from '@/lib/dal';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify session and redirect to summary if onboarding already complete
  await verifySessionForOnboarding();

  return (
    <div className="min-h-[100svh] bg-background overflow-x-hidden">
      <div className="mx-auto max-w-lg px-4 px-safe pt-safe">{children}</div>
    </div>
  );
}
