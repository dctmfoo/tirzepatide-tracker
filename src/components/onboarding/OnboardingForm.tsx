'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CollapsibleSection } from './CollapsibleSection';
import { WeightInput } from './WeightInput';
import { HeightInput } from './HeightInput';
import { PushNotificationPrompt } from './PushNotificationPrompt';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  onboardingSchema,
  type OnboardingFormData,
  type WeightUnit,
  type HeightUnit,
  type Gender,
  type DoseValue,
  type InjectionSite,
  GENDERS,
  GENDER_LABELS,
  VALID_DOSES,
  INJECTION_SITES,
  INJECTION_SITE_LABELS,
} from '@/lib/validations/onboarding';

type FormErrors = Partial<Record<keyof OnboardingFormData | 'firstInjection.doseMg' | 'firstInjection.injectionSite' | 'firstInjection.injectionDate', string>>;

export function OnboardingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  // Form state
  const [age, setAge] = useState<number | undefined>();
  const [gender, setGender] = useState<Gender | undefined>();
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');

  const [startingWeightKg, setStartingWeightKg] = useState<number | undefined>();
  const [goalWeightKg, setGoalWeightKg] = useState<number | undefined>();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [treatmentStartDate, setTreatmentStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [injectionDate, setInjectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [doseMg, setDoseMg] = useState<DoseValue | undefined>();
  const [injectionSite, setInjectionSite] = useState<InjectionSite | undefined>();

  // Check section completion
  const isAboutYouComplete = useMemo(
    () => age !== undefined && gender !== undefined && heightCm !== undefined,
    [age, gender, heightCm]
  );

  const isGoalsComplete = useMemo(
    () =>
      startingWeightKg !== undefined &&
      goalWeightKg !== undefined &&
      treatmentStartDate !== '',
    [startingWeightKg, goalWeightKg, treatmentStartDate]
  );

  const isInjectionComplete = useMemo(
    () => injectionDate !== '' && doseMg !== undefined && injectionSite !== undefined,
    [injectionDate, doseMg, injectionSite]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      setErrors({});

      // Build form data
      const formData: OnboardingFormData = {
        age: age ?? 0,
        gender: gender ?? 'other',
        heightCm: heightCm ?? 0,
        heightUnit,
        startingWeightKg: startingWeightKg ?? 0,
        goalWeightKg: goalWeightKg ?? 0,
        weightUnit,
        treatmentStartDate,
        firstInjection: {
          doseMg: doseMg ?? 0,
          injectionSite: injectionSite ?? 'abdomen_left',
          injectionDate: new Date(injectionDate).toISOString(),
        },
      };

      // Validate
      const result = onboardingSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: FormErrors = {};
        for (const issue of result.error.issues) {
          const path = issue.path.join('.');
          fieldErrors[path as keyof FormErrors] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data),
        });

        const data = await response.json();

        if (!response.ok) {
          setSubmitError(data.error || 'Something went wrong');
          return;
        }

        // Success - show push notification prompt
        setShowPushPrompt(true);
      } catch {
        setSubmitError('Failed to save. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      age,
      gender,
      heightCm,
      heightUnit,
      startingWeightKg,
      goalWeightKg,
      weightUnit,
      treatmentStartDate,
      doseMg,
      injectionSite,
      injectionDate,
      router,
    ]
  );

  const handlePushPromptComplete = useCallback(() => {
    router.push('/summary');
    router.refresh();
  }, [router]);

  const inputClasses =
    'w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all';

  const selectClasses =
    'w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all appearance-none cursor-pointer';

  // Show push notification prompt after successful form submission
  if (showPushPrompt) {
    return <PushNotificationPrompt onComplete={handlePushPromptComplete} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Section 1: About You */}
      <CollapsibleSection title="About You" isComplete={isAboutYouComplete}>
        <div className="space-y-4">
          {/* Age */}
          <div className="space-y-2">
            <label htmlFor="age" className="block text-sm font-medium text-muted-foreground">
              Age
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min="18"
              max="120"
              value={age ?? ''}
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              placeholder="Enter your age"
              className={`${inputClasses} ${errors.age ? 'border-destructive' : ''}`}
            />
            {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label htmlFor="gender" className="block text-sm font-medium text-muted-foreground">
              Gender
            </label>
            <div className="relative">
              <select
                id="gender"
                value={gender ?? ''}
                onChange={(e) => setGender(e.target.value as Gender)}
                className={`${selectClasses} ${errors.gender ? 'border-destructive' : ''}`}
              >
                <option value="" disabled>
                  Select gender
                </option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {GENDER_LABELS[g]}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
          </div>

          {/* Height */}
          <HeightInput
            id="height"
            label="Height"
            value={heightCm}
            unit={heightUnit}
            onChange={setHeightCm}
            onUnitChange={setHeightUnit}
            error={errors.heightCm}
          />
        </div>
      </CollapsibleSection>

      {/* Section 2: Your Goals */}
      <CollapsibleSection title="Your Goals" isComplete={isGoalsComplete}>
        <div className="space-y-4">
          {/* Starting Weight */}
          <WeightInput
            id="startingWeight"
            label="Starting Weight"
            value={startingWeightKg}
            unit={weightUnit}
            onChange={setStartingWeightKg}
            onUnitChange={setWeightUnit}
            error={errors.startingWeightKg}
            placeholder="Enter starting weight"
          />

          {/* Goal Weight */}
          <WeightInput
            id="goalWeight"
            label="Goal Weight"
            value={goalWeightKg}
            unit={weightUnit}
            onChange={setGoalWeightKg}
            onUnitChange={setWeightUnit}
            error={errors.goalWeightKg}
            placeholder="Enter goal weight"
          />

          {/* Treatment Start Date */}
          <div className="space-y-2">
            <label
              htmlFor="treatmentStartDate"
              className="block text-sm font-medium text-muted-foreground"
            >
              Treatment Start Date
            </label>
            <input
              id="treatmentStartDate"
              type="date"
              value={treatmentStartDate}
              onChange={(e) => setTreatmentStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`${inputClasses} ${errors.treatmentStartDate ? 'border-destructive' : ''}`}
            />
            {errors.treatmentStartDate && (
              <p className="text-sm text-destructive">{errors.treatmentStartDate}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: First Injection */}
      <CollapsibleSection title="First Injection" isComplete={isInjectionComplete}>
        <div className="space-y-4">
          {/* Injection Date */}
          <div className="space-y-2">
            <label
              htmlFor="injectionDate"
              className="block text-sm font-medium text-muted-foreground"
            >
              Injection Date
            </label>
            <input
              id="injectionDate"
              type="date"
              value={injectionDate}
              onChange={(e) => setInjectionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={`${inputClasses} ${errors['firstInjection.injectionDate'] ? 'border-destructive' : ''}`}
            />
            {errors['firstInjection.injectionDate'] && (
              <p className="text-sm text-destructive">{errors['firstInjection.injectionDate']}</p>
            )}
          </div>

          {/* Dose */}
          <div className="space-y-2">
            <label htmlFor="dose" className="block text-sm font-medium text-muted-foreground">
              Dose
            </label>
            <div className="relative">
              <select
                id="dose"
                value={doseMg ?? ''}
                onChange={(e) => setDoseMg(parseFloat(e.target.value) as DoseValue)}
                className={`${selectClasses} ${errors['firstInjection.doseMg'] ? 'border-destructive' : ''}`}
              >
                <option value="" disabled>
                  Select dose
                </option>
                {VALID_DOSES.map((d) => (
                  <option key={d} value={d}>
                    {d} mg
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors['firstInjection.doseMg'] && (
              <p className="text-sm text-destructive">{errors['firstInjection.doseMg']}</p>
            )}
          </div>

          {/* Injection Site */}
          <div className="space-y-2">
            <label htmlFor="injectionSite" className="block text-sm font-medium text-muted-foreground">
              Injection Site
            </label>
            <div className="relative">
              <select
                id="injectionSite"
                value={injectionSite ?? ''}
                onChange={(e) => setInjectionSite(e.target.value as InjectionSite)}
                className={`${selectClasses} ${errors['firstInjection.injectionSite'] ? 'border-destructive' : ''}`}
              >
                <option value="" disabled>
                  Select injection site
                </option>
                {INJECTION_SITES.map((s) => (
                  <option key={s} value={s}>
                    {INJECTION_SITE_LABELS[s]}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors['firstInjection.injectionSite'] && (
              <p className="text-sm text-destructive">{errors['firstInjection.injectionSite']}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="w-full rounded-xl py-4 text-lg"
        >
          {isSubmitting ? 'Setting up...' : 'Start My Journey'}
        </Button>
      </div>
    </form>
  );
}
