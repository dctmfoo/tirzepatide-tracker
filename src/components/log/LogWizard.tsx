'use client';

import { useLogWizard } from './useLogWizard';
import { StepMental } from './steps/StepMental';
import { StepSideEffects } from './steps/StepSideEffects';
import { StepDiet } from './steps/StepDiet';
import { StepActivity } from './steps/StepActivity';
import { WizardProgress } from './WizardProgress';
import { WizardFooter } from './WizardFooter';
import type { DailyLogData } from '@/lib/data/daily-log';
import Link from 'next/link';

type LogWizardProps = {
  logDate: string;
  initialData: DailyLogData | null;
  redirectTo: '/summary' | '/calendar';
  showBackButton?: boolean;
};

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function LogWizard({ logDate, initialData, redirectTo, showBackButton = false }: LogWizardProps) {
  const wizard = useLogWizard(logDate, initialData);

  const renderStep = () => {
    const props = {
      stepData: wizard.stepData,
      updateStepData: wizard.updateStepData,
    };

    switch (wizard.currentStep) {
      case 'mental':
        return <StepMental {...props} />;
      case 'sideEffects':
        return <StepSideEffects {...props} />;
      case 'diet':
        return <StepDiet {...props} />;
      case 'activity':
        return <StepActivity {...props} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-32">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link
              href="/calendar"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-muted-foreground hover:text-foreground"
            >
              ←
            </Link>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground">Daily Log</h1>
              <span className="text-sm text-muted-foreground">
                {formatDateDisplay(logDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <WizardProgress
        current={wizard.currentIndex}
        total={wizard.totalSteps}
        autoSaveStatus={wizard.autoSaveStatus}
      />

      {/* Step content */}
      <div className="flex-1 px-4 py-6">
        {renderStep()}
      </div>

      {/* Navigation footer */}
      <WizardFooter
        onPrev={wizard.prev}
        onNext={wizard.next}
        onFinish={wizard.saveNow}
        isFirst={wizard.isFirst}
        isLast={wizard.isLast}
        redirectTo={redirectTo}
      />
    </div>
  );
}
