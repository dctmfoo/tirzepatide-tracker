import { OnboardingForm } from '@/components/onboarding/OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Welcome to Mounjaro Tracker
        </h1>
        <p className="text-foreground-muted">
          Let&apos;s set up your journey in just a few steps
        </p>
      </div>

      <OnboardingForm />
    </div>
  );
}
