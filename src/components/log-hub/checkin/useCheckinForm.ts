'use client';

import { useState, useCallback } from 'react';
import type { DailyLogData } from '@/lib/data/daily-log';

// Types matching the API schema
export type MoodLevel = 'Poor' | 'Fair' | 'Good' | 'Great' | 'Excellent';
export type CravingsLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Intense';
export type MotivationLevel = 'Low' | 'Medium' | 'High';
export type HungerLevel = 'None' | 'Low' | 'Moderate' | 'High' | 'Intense';
export type WorkoutType = 'Strength training' | 'Cardio' | 'Walking' | 'Rest day' | 'Other';

// Default side effects to show sliders for
export const DEFAULT_SIDE_EFFECTS = [
  'Nausea',
  'Fatigue',
  'Headache',
  'Constipation',
  'Diarrhea',
  'Dizziness',
] as const;

export type SideEffectSlider = {
  effectType: string;
  severity: number; // 0-5
};

export type CheckinFormState = {
  // Mood & Energy
  moodLevel: MoodLevel | null;
  cravingsLevel: CravingsLevel | null;
  motivationLevel: MotivationLevel | null;

  // Side Effects (array of slider values)
  sideEffects: SideEffectSlider[];

  // Diet
  mealsCount: number;
  proteinGrams: number;
  waterLiters: number;
  hungerLevel: HungerLevel | null;

  // Activity
  steps: number;
  durationMinutes: number;
  workoutType: WorkoutType | null;

  // Notes
  notes: string;
};

const createInitialState = (existingData?: DailyLogData): CheckinFormState => {
  // Initialize side effects from existing data or default to zero for all default types
  const existingSideEffectsMap = new Map(
    existingData?.sideEffects.map((se) => [se.effectType, se.severity]) || []
  );

  const sideEffects: SideEffectSlider[] = DEFAULT_SIDE_EFFECTS.map((type) => ({
    effectType: type,
    severity: existingSideEffectsMap.get(type) || 0,
  }));

  // Add any custom side effects from existing data
  existingData?.sideEffects.forEach((se) => {
    if (!DEFAULT_SIDE_EFFECTS.includes(se.effectType as typeof DEFAULT_SIDE_EFFECTS[number])) {
      sideEffects.push({ effectType: se.effectType, severity: se.severity });
    }
  });

  return {
    moodLevel: (existingData?.mental?.moodLevel as MoodLevel) || null,
    cravingsLevel: (existingData?.mental?.cravingsLevel as CravingsLevel) || null,
    motivationLevel: (existingData?.mental?.motivationLevel as MotivationLevel) || null,
    sideEffects,
    mealsCount: existingData?.diet?.mealsCount || 0,
    proteinGrams: existingData?.diet?.proteinGrams || 0,
    waterLiters: existingData?.diet?.waterLiters || 0,
    hungerLevel: (existingData?.diet?.hungerLevel as HungerLevel) || null,
    steps: existingData?.activity?.steps || 0,
    durationMinutes: existingData?.activity?.durationMinutes || 0,
    workoutType: (existingData?.activity?.workoutType as WorkoutType) || null,
    notes: existingData?.mental?.notes || existingData?.diet?.notes || existingData?.activity?.notes || '',
  };
};

export function useCheckinForm(existingData?: DailyLogData) {
  const [formState, setFormState] = useState<CheckinFormState>(() =>
    createInitialState(existingData)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate completed sections for progress
  const completedSections = {
    mood: formState.moodLevel !== null,
    sideEffects: formState.sideEffects.some((se) => se.severity > 0),
    diet: formState.mealsCount > 0 || formState.proteinGrams > 0 || formState.waterLiters > 0,
    activity: formState.steps > 0 || formState.durationMinutes > 0 || formState.workoutType !== null,
  };

  const completedCount = Object.values(completedSections).filter(Boolean).length;

  // Update functions
  const updateMood = useCallback((field: 'moodLevel' | 'cravingsLevel' | 'motivationLevel', value: string | null) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateSideEffect = useCallback((effectType: string, severity: number) => {
    setFormState((prev) => ({
      ...prev,
      sideEffects: prev.sideEffects.map((se) =>
        se.effectType === effectType ? { ...se, severity } : se
      ),
    }));
  }, []);

  const addCustomSideEffect = useCallback((effectType: string) => {
    setFormState((prev) => ({
      ...prev,
      sideEffects: [...prev.sideEffects, { effectType, severity: 0 }],
    }));
  }, []);

  const updateDiet = useCallback(
    (field: 'mealsCount' | 'proteinGrams' | 'waterLiters' | 'hungerLevel', value: number | string | null) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateActivity = useCallback(
    (field: 'steps' | 'durationMinutes' | 'workoutType', value: number | string | null) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateNotes = useCallback((notes: string) => {
    setFormState((prev) => ({ ...prev, notes }));
  }, []);

  // Save function - calls API
  const save = useCallback(async (date: string) => {
    setIsSaving(true);
    setError(null);

    try {
      // Filter out side effects with severity 0
      const nonZeroSideEffects = formState.sideEffects
        .filter((se) => se.severity > 0)
        .map((se) => ({
          effectType: se.effectType,
          severity: se.severity,
        }));

      const payload = {
        logDate: date,
        mental: formState.moodLevel || formState.cravingsLevel || formState.motivationLevel
          ? {
              moodLevel: formState.moodLevel || undefined,
              cravingsLevel: formState.cravingsLevel || undefined,
              motivationLevel: formState.motivationLevel || undefined,
              notes: formState.notes || undefined,
            }
          : undefined,
        sideEffects: nonZeroSideEffects.length > 0 ? nonZeroSideEffects : undefined,
        diet: formState.mealsCount > 0 || formState.proteinGrams > 0 || formState.waterLiters > 0 || formState.hungerLevel
          ? {
              mealsCount: formState.mealsCount || undefined,
              proteinGrams: formState.proteinGrams || undefined,
              waterLiters: formState.waterLiters || undefined,
              hungerLevel: formState.hungerLevel || undefined,
            }
          : undefined,
        activity: formState.steps > 0 || formState.durationMinutes > 0 || formState.workoutType
          ? {
              steps: formState.steps || undefined,
              durationMinutes: formState.durationMinutes || undefined,
              workoutType: formState.workoutType || undefined,
            }
          : undefined,
      };

      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save check-in');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formState]);

  return {
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
  };
}
