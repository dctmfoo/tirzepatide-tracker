'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useCheckinForm,
  MoodSection,
  SideEffectsSection,
  DietSection,
  ActivitySection,
  NotesSection,
} from './index';
import type { DailyLogData } from '@/lib/data/daily-log';
import type { HungerLevel, WorkoutType } from './useCheckinForm';

type CheckinPageContentProps = {
  date: string;
  displayDate: string;
  isToday: boolean;
  existingData?: DailyLogData;
};

export function CheckinPageContent({
  date,
  displayDate,
  isToday,
  existingData,
}: CheckinPageContentProps) {
  const router = useRouter();
  const {
    formState,
    completedSections,
    completedCount,
    isSaving,
    error,
    updateMood,
    updateSideEffect,
    addCustomSideEffect,
    updateDiet,
    updateActivity,
    updateNotes,
    save,
  } = useCheckinForm(existingData || undefined);

  const handleSave = async () => {
    const success = await save(date);
    if (success) {
      router.push('/log');
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-3 overflow-x-hidden p-4 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link
          href="/log"
          className="flex items-center gap-1 text-muted-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-[0.875rem] font-medium">Back</span>
        </Link>
        <h1 className="text-[1.0625rem] font-semibold text-foreground">Daily Check-in</h1>
        <span className="text-[0.875rem] text-muted-foreground">
          {isToday ? 'Today' : displayDate}
        </span>
      </header>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[0.75rem] font-medium text-success">
          <Check className="h-3.5 w-3.5" />
          {completedCount} of 4 sections
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Sections */}
      <MoodSection
        moodLevel={formState.moodLevel}
        cravingsLevel={formState.cravingsLevel}
        motivationLevel={formState.motivationLevel}
        onMoodChange={(value) => updateMood('moodLevel', value)}
        onCravingsChange={(value) => updateMood('cravingsLevel', value)}
        onMotivationChange={(value) => updateMood('motivationLevel', value)}
        isComplete={completedSections.mood}
      />

      <SideEffectsSection
        sideEffects={formState.sideEffects}
        onSideEffectChange={updateSideEffect}
        onAddCustom={addCustomSideEffect}
      />

      <DietSection
        mealsCount={formState.mealsCount}
        proteinGrams={formState.proteinGrams}
        waterLiters={formState.waterLiters}
        hungerLevel={formState.hungerLevel}
        onMealsChange={(value) => updateDiet('mealsCount', value)}
        onProteinChange={(value) => updateDiet('proteinGrams', value)}
        onWaterChange={(value) => updateDiet('waterLiters', value)}
        onHungerChange={(value) => updateDiet('hungerLevel', value as HungerLevel | null)}
        isComplete={completedSections.diet}
      />

      <ActivitySection
        steps={formState.steps}
        durationMinutes={formState.durationMinutes}
        workoutType={formState.workoutType}
        onStepsChange={(value) => updateActivity('steps', value)}
        onDurationChange={(value) => updateActivity('durationMinutes', value)}
        onWorkoutTypeChange={(value) => updateActivity('workoutType', value as WorkoutType | null)}
      />

      <NotesSection
        notes={formState.notes}
        onNotesChange={updateNotes}
      />

      {/* Save Button */}
      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-xl py-6 text-base font-semibold"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="mr-2 h-5 w-5" />
            Save Check-in
          </>
        )}
      </Button>
    </div>
  );
}
