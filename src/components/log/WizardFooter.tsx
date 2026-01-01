'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6">
      <div className="flex gap-3">
        {!isFirst && (
          <Button
            type="button"
            onClick={handlePrev}
            variant="outline"
            className="flex-1 rounded-xl py-4"
          >
            Back
          </Button>
        )}

        {isFirst && (
          <Button
            type="button"
            onClick={handleNext}
            variant="outline"
            className="flex-1 rounded-xl py-4 text-muted-foreground"
          >
            Skip
          </Button>
        )}

        <Button
          type="button"
          onClick={isLast ? handleFinish : handleNext}
          className="flex-1 rounded-xl py-4"
        >
          {isLast ? 'Done' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
