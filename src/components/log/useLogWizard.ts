'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DailyLogData, SideEffectData, DietData, ActivityData, MentalData } from '@/lib/data/daily-log';

const STEPS = ['mental', 'sideEffects', 'diet', 'activity'] as const;
export type Step = typeof STEPS[number];

export type StepData = {
  mental: Partial<MentalData>;
  sideEffects: SideEffectData[];
  diet: Partial<DietData>;
  activity: Partial<ActivityData>;
};

type UseLogWizardReturn = {
  currentStep: Step;
  currentIndex: number;
  totalSteps: number;
  stepData: StepData;
  updateStepData: <K extends keyof StepData>(step: K, data: StepData[K]) => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  isFirst: boolean;
  isLast: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
};

async function saveToServer(logDate: string, stepData: StepData): Promise<boolean> {
  try {
    const body: {
      logDate: string;
      diet?: DietData;
      activity?: ActivityData;
      mental?: MentalData;
      sideEffects?: SideEffectData[];
    } = { logDate };

    // Add diet if any field is filled
    const diet = stepData.diet;
    if (diet.hungerLevel || diet.mealsCount || diet.proteinGrams || diet.waterLiters || diet.notes) {
      body.diet = {
        hungerLevel: diet.hungerLevel || undefined,
        mealsCount: diet.mealsCount,
        proteinGrams: diet.proteinGrams,
        waterLiters: diet.waterLiters,
        notes: diet.notes || undefined,
      };
    }

    // Add activity if any field is filled
    const activity = stepData.activity;
    if (activity.workoutType || activity.durationMinutes || activity.steps || activity.notes) {
      body.activity = {
        workoutType: activity.workoutType || undefined,
        durationMinutes: activity.durationMinutes,
        steps: activity.steps,
        notes: activity.notes || undefined,
      };
    }

    // Add mental if any field is filled
    const mental = stepData.mental;
    if (mental.motivationLevel || mental.cravingsLevel || mental.moodLevel || mental.notes) {
      body.mental = {
        motivationLevel: mental.motivationLevel || undefined,
        cravingsLevel: mental.cravingsLevel || undefined,
        moodLevel: mental.moodLevel || undefined,
        notes: mental.notes || undefined,
      };
    }

    // Add side effects (filter out incomplete entries)
    // Always include sideEffects array (even empty) so API knows to delete removed ones
    const sideEffects = stepData.sideEffects;
    const validSideEffects = sideEffects
      .filter((se) => se.effectType)
      .map((se) => ({
        effectType: se.effectType,
        severity: se.severity,
        notes: se.notes || undefined,
      }));
    body.sideEffects = validSideEffects;

    const response = await fetch('/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function useLogWizard(logDate: string, initialData: DailyLogData | null): UseLogWizardReturn {
  const [currentStep, setCurrentStep] = useState<Step>('mental');
  const [stepData, setStepData] = useState<StepData>({
    mental: initialData?.mental || {},
    sideEffects: initialData?.sideEffects || [],
    diet: initialData?.diet || {},
    activity: initialData?.activity || {},
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentIndex = STEPS.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  const next = useCallback(async () => {
    if (!isLast) {
      // Save immediately before moving to next step
      if (hasUnsavedChanges) {
        // Cancel any pending auto-save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        setAutoSaveStatus('saving');
        const success = await saveToServer(logDate, stepData);
        if (success) {
          setHasUnsavedChanges(false);
          setAutoSaveStatus('saved');
        } else {
          setAutoSaveStatus('error');
        }
      }
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentIndex, isLast, hasUnsavedChanges, logDate, stepData]);

  const prev = useCallback(async () => {
    if (!isFirst) {
      // Save immediately before moving to previous step
      if (hasUnsavedChanges) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        setAutoSaveStatus('saving');
        const success = await saveToServer(logDate, stepData);
        if (success) {
          setHasUnsavedChanges(false);
          setAutoSaveStatus('saved');
        } else {
          setAutoSaveStatus('error');
        }
      }
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentIndex, isFirst, hasUnsavedChanges, logDate, stepData]);

  const updateStepData = useCallback(<K extends keyof StepData>(step: K, data: StepData[K]) => {
    setStepData(prev => ({
      ...prev,
      [step]: data,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const saveNow = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setAutoSaveStatus('saving');
    const success = await saveToServer(logDate, stepData);

    if (success) {
      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } else {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [hasUnsavedChanges, logDate, stepData]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      const success = await saveToServer(logDate, stepData);

      if (success) {
        setAutoSaveStatus('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } else {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, logDate, stepData]);

  // Navigation guard - warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  return {
    currentStep,
    currentIndex,
    totalSteps: STEPS.length,
    stepData,
    updateStepData,
    next,
    prev,
    isFirst,
    isLast,
    autoSaveStatus,
    hasUnsavedChanges,
    saveNow,
  };
}
