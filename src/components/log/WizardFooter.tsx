'use client';

import { useRouter } from 'next/navigation';

type WizardFooterProps = {
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
  onFinish: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
  redirectTo: '/summary' | '/calendar';
};

export function WizardFooter({
  onPrev,
  onNext,
  onFinish,
  isFirst,
  isLast,
  redirectTo,
}: WizardFooterProps) {
  const router = useRouter();

  const handleFinish = async () => {
    // Save any unsaved changes before redirecting
    await onFinish();
    router.push(redirectTo);
  };

  const handleNext = async () => {
    await onNext();
  };

  const handlePrev = async () => {
    await onPrev();
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6">
      <div className="flex gap-3">
        {!isFirst && (
          <button
            type="button"
            onClick={handlePrev}
            className="flex-1 py-4 rounded-xl bg-card border border-border font-medium text-foreground transition-colors hover:bg-accent"
          >
            Back
          </button>
        )}

        {isFirst && (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-4 rounded-xl bg-card border border-border text-muted-foreground font-medium transition-colors hover:bg-accent"
          >
            Skip
          </button>
        )}

        <button
          type="button"
          onClick={isLast ? handleFinish : handleNext}
          className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
