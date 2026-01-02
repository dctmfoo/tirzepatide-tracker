'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cake,
  Users,
  Ruler,
  Scale,
  Target,
  Calendar,
  CalendarCheck,
  Pill,
  MapPin,
  CheckCircle2,
  Rocket,
  ArrowLeft,
  ArrowRight,
  User,
  Heart,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PushNotificationPrompt } from './PushNotificationPrompt';
import { cn } from '@/lib/utils';
import {
  onboardingSchema,
  type OnboardingFormData,
  type WeightUnit,
  type HeightUnit,
  type Gender,
  type DoseValue,
  type InjectionSite,
  VALID_DOSES,
  INJECTION_SITES,
  INJECTION_SITE_LABELS,
  feetInchesToCm,
  lbsToKg,
} from '@/lib/validations/onboarding';
type QuestionId =
  | 'age'
  | 'gender'
  | 'height'
  | 'startWeight'
  | 'goalWeight'
  | 'treatmentDate'
  | 'injectionDate'
  | 'dose'
  | 'site'
  | 'complete';
const QUESTIONS: QuestionId[] = [
  'age',
  'gender',
  'height',
  'startWeight',
  'goalWeight',
  'treatmentDate',
  'injectionDate',
  'dose',
  'site',
  'complete',
];
const QUESTION_CONFIG: Record<
  Exclude<QuestionId, 'complete'>,
  { title: string; subtitle: string; icon: typeof Cake; color: string }
> = {
  age: {
    title: 'How old are you?',
    subtitle: 'This helps personalize your experience',
    icon: Cake,
    color: 'primary',
  },
  gender: {
    title: "What's your gender?",
    subtitle: 'Used for BMI calculations',
    icon: Users,
    color: 'blue',
  },
  height: {
    title: 'How tall are you?',
    subtitle: "We'll calculate your BMI",
    icon: Ruler,
    color: 'success',
  },
  startWeight: {
    title: "What's your current weight?",
    subtitle: 'Your starting point for tracking',
    icon: Scale,
    color: 'warning',
  },
  goalWeight: {
    title: "What's your goal weight?",
    subtitle: "We'll track your progress",
    icon: Target,
    color: 'success',
  },
  treatmentDate: {
    title: 'When did you start treatment?',
    subtitle: 'The date you began Mounjaro',
    icon: Calendar,
    color: 'primary',
  },
  injectionDate: {
    title: 'When was your first injection?',
    subtitle: "We'll calculate your schedule",
    icon: CalendarCheck,
    color: 'violet',
  },
  dose: {
    title: 'What dose did you take?',
    subtitle: 'Your first injection dosage',
    icon: Pill,
    color: 'violet',
  },
  site: {
    title: 'Where did you inject?',
    subtitle: 'Track injection site rotation',
    icon: MapPin,
    color: 'violet',
  },
};
const COLOR_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary' },
  success: { bg: 'bg-success/15', text: 'text-success', border: 'border-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning' },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-500', border: 'border-violet-500' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-500', border: 'border-blue-500' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-500', border: 'border-amber-500' },
};
export function OnboardingCardFlow() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionId>('age');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  // Form state
  const [age, setAge] = useState<number | undefined>();
  const [gender, setGender] = useState<Gender | undefined>();
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightFeet, setHeightFeet] = useState<number | undefined>();
  const [heightInches, setHeightInches] = useState<number | undefined>();
  const [startingWeightKg, setStartingWeightKg] = useState<number | undefined>();
  const [goalWeightKg, setGoalWeightKg] = useState<number | undefined>();
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [treatmentStartDate, setTreatmentStartDate] = useState<string>('');
  const [injectionDate, setInjectionDate] = useState<string>('');
  const [doseMg, setDoseMg] = useState<DoseValue | undefined>();
  const [injectionSite, setInjectionSite] = useState<InjectionSite | undefined>();
  // Track answered questions
  const [answered, setAnswered] = useState<Set<QuestionId>>(new Set());
  // Refs for scrolling
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const today = new Date().toISOString().split('T')[0];
  const scrollToQuestion = useCallback((questionId: QuestionId) => {
    setTimeout(() => {
      questionRefs.current[questionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  }, []);
  const goToNext = useCallback(
    (current: QuestionId, markAnswered = true) => {
      if (markAnswered) {
        setAnswered((prev) => new Set(prev).add(current));
      }
      const currentIndex = QUESTIONS.indexOf(current);
      const nextQuestion = QUESTIONS[currentIndex + 1];
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        scrollToQuestion(nextQuestion);
      }
    },
    [scrollToQuestion]
  );
  // Calculate progress
  const progress = Math.round((answered.size / (QUESTIONS.length - 1)) * 100);
  // Check if all required fields are filled
  const isComplete =
    age !== undefined &&
    gender !== undefined &&
    (heightUnit === 'cm' ? heightCm !== undefined : heightFeet !== undefined) &&
    startingWeightKg !== undefined &&
    goalWeightKg !== undefined &&
    treatmentStartDate !== '' &&
    injectionDate !== '' &&
    doseMg !== undefined &&
    injectionSite !== undefined;
  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    // Calculate final height in cm
    let finalHeightCm = heightCm;
    if (heightUnit === 'ft-in' && heightFeet !== undefined) {
      finalHeightCm = feetInchesToCm(heightFeet, heightInches ?? 0);
    }
    // Calculate final weights in kg
    let finalStartWeight = startingWeightKg;
    let finalGoalWeight = goalWeightKg;
    if (weightUnit === 'lbs') {
      finalStartWeight = startingWeightKg ? lbsToKg(startingWeightKg) : undefined;
      finalGoalWeight = goalWeightKg ? lbsToKg(goalWeightKg) : undefined;
    }
    const formData: OnboardingFormData = {
      age: age ?? 0,
      gender: gender ?? 'other',
      heightCm: finalHeightCm ?? 0,
      heightUnit,
      startingWeightKg: finalStartWeight ?? 0,
      goalWeightKg: finalGoalWeight ?? 0,
      weightUnit,
      treatmentStartDate,
      firstInjection: {
        doseMg: doseMg ?? 0,
        injectionSite: injectionSite ?? 'abdomen_left',
        injectionDate: new Date(injectionDate).toISOString(),
      },
    };
    const result = onboardingSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.issues[0];
      setSubmitError(firstError.message);
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
      setShowPushPrompt(true);
    } catch {
      setSubmitError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    age,
    gender,
    heightCm,
    heightUnit,
    heightFeet,
    heightInches,
    startingWeightKg,
    goalWeightKg,
    weightUnit,
    treatmentStartDate,
    doseMg,
    injectionSite,
    injectionDate,
  ]);
  const handlePushPromptComplete = useCallback(() => {
    router.push('/summary');
    router.refresh();
  }, [router]);
  // Show push notification prompt after successful submission
  if (showPushPrompt) {
    return <PushNotificationPrompt onComplete={handlePushPromptComplete} />;
  }
  const renderQuestionCard = (
    questionId: Exclude<QuestionId, 'complete'>,
    children: React.ReactNode
  ) => {
    const config = QUESTION_CONFIG[questionId];
    const Icon = config.icon;
    const colors = COLOR_STYLES[config.color];
    const isCurrent = currentQuestion === questionId;
    const isAnswered = answered.has(questionId);
    return (
      <div
        ref={(el) => {
          questionRefs.current[questionId] = el;
        }}
        className={cn(
          'transition-all duration-300',
          isAnswered && !isCurrent && 'opacity-60 scale-[0.98]',
          isCurrent && 'scale-100 opacity-100'
        )}
      >
        <Card
          className={cn(
            'border-2 transition-all duration-300',
            isCurrent ? colors.border : 'border-border',
            isCurrent && 'shadow-lg'
          )}
        >
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  colors.bg
                )}
              >
                <Icon className={cn('h-6 w-6', colors.text)} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{config.subtitle}</p>
              </div>
            </div>
            {/* Content */}
            {children}
          </CardContent>
        </Card>
      </div>
    );
  };
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col overflow-x-hidden">
      {/* Header with progress */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary">
            {answered.size} of {QUESTIONS.length - 1} complete
          </span>
          <div className="flex gap-1">
            {QUESTIONS.slice(0, -1).map((q) => (
              <div
                key={q}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  answered.has(q)
                    ? 'bg-success'
                    : currentQuestion === q
                      ? 'bg-primary w-4'
                      : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
      {/* Questions */}
      <div className="flex-1 space-y-4">
        {/* Q1: Age */}
        {renderQuestionCard(
          'age',
          <div className="space-y-3">
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Enter your age"
                min={18}
                max={120}
                value={age ?? ''}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="text-lg py-6 pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                years
              </span>
            </div>
            <Button
              onClick={() => goToNext('age')}
              disabled={!age || age < 18 || age > 120}
              className="w-full"
              variant="outline"
            >
              Continue
            </Button>
          </div>
        )}
        {/* Q2: Gender */}
        {renderQuestionCard(
          'gender',
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'male' as Gender, label: 'Male', icon: User, color: 'blue' },
              { value: 'female' as Gender, label: 'Female', icon: User, color: 'pink' },
              { value: 'other' as Gender, label: 'Other', icon: Heart, color: 'amber' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setGender(option.value);
                  goToNext('gender');
                }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  gender === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    option.color === 'blue' && 'bg-blue-500/15',
                    option.color === 'pink' && 'bg-pink-500/15',
                    option.color === 'amber' && 'bg-amber-500/15'
                  )}
                >
                  <option.icon
                    className={cn(
                      'h-5 w-5',
                      option.color === 'blue' && 'text-blue-500',
                      option.color === 'pink' && 'text-pink-500',
                      option.color === 'amber' && 'text-amber-500'
                    )}
                  />
                </div>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        )}
        {/* Q3: Height */}
        {renderQuestionCard(
          'height',
          <div className="space-y-3">
            <ToggleGroup
              type="single"
              value={heightUnit}
              onValueChange={(v) => v && setHeightUnit(v as HeightUnit)}
              className="w-full"
            >
              <ToggleGroupItem value="cm" className="flex-1">
                cm
              </ToggleGroupItem>
              <ToggleGroupItem value="ft-in" className="flex-1">
                ft / in
              </ToggleGroupItem>
            </ToggleGroup>
            {heightUnit === 'cm' ? (
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="175"
                  min={100}
                  max={250}
                  value={heightCm ?? ''}
                  onChange={(e) =>
                    setHeightCm(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="text-lg py-6 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  cm
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="5"
                    min={3}
                    max={8}
                    value={heightFeet ?? ''}
                    onChange={(e) =>
                      setHeightFeet(e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    className="text-lg py-6 pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="8"
                    min={0}
                    max={11}
                    value={heightInches ?? ''}
                    onChange={(e) =>
                      setHeightInches(e.target.value ? parseInt(e.target.value, 10) : undefined)
                    }
                    className="text-lg py-6 pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    in
                  </span>
                </div>
              </div>
            )}
            <Button
              onClick={() => goToNext('height')}
              disabled={heightUnit === 'cm' ? !heightCm : !heightFeet}
              className="w-full"
              variant="outline"
            >
              Continue
            </Button>
          </div>
        )}
        {/* Q4: Starting Weight */}
        {renderQuestionCard(
          'startWeight',
          <div className="space-y-3">
            <ToggleGroup
              type="single"
              value={weightUnit}
              onValueChange={(v) => v && setWeightUnit(v as WeightUnit)}
              className="w-full"
            >
              <ToggleGroupItem value="kg" className="flex-1">
                kg
              </ToggleGroupItem>
              <ToggleGroupItem value="lbs" className="flex-1">
                lbs
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="85"
                step="0.1"
                value={startingWeightKg ?? ''}
                onChange={(e) =>
                  setStartingWeightKg(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="text-lg py-6 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {weightUnit}
              </span>
            </div>
            <Button
              onClick={() => goToNext('startWeight')}
              disabled={!startingWeightKg}
              className="w-full"
              variant="outline"
            >
              Continue
            </Button>
          </div>
        )}
        {/* Q5: Goal Weight */}
        {renderQuestionCard(
          'goalWeight',
          <div className="space-y-3">
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="70"
                step="0.1"
                value={goalWeightKg ?? ''}
                onChange={(e) =>
                  setGoalWeightKg(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="text-lg py-6 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {weightUnit}
              </span>
            </div>
            {startingWeightKg && goalWeightKg && startingWeightKg > goalWeightKg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                <Target className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Target: -{(startingWeightKg - goalWeightKg).toFixed(1)} {weightUnit}
                </span>
              </div>
            )}
            <Button
              onClick={() => goToNext('goalWeight')}
              disabled={!goalWeightKg}
              className="w-full"
              variant="outline"
            >
              Continue
            </Button>
          </div>
        )}
        {/* Q6: Treatment Start Date */}
        {renderQuestionCard(
          'treatmentDate',
          <div className="space-y-3">
            <Input
              type="date"
              value={treatmentStartDate}
              onChange={(e) => setTreatmentStartDate(e.target.value)}
              max={today}
              className="text-lg py-6"
            />
            <Button
              onClick={() => goToNext('treatmentDate')}
              disabled={!treatmentStartDate}
              className="w-full"
              variant="outline"
            >
              Continue
            </Button>
          </div>
        )}
        {/* Q7: Injection Date */}
        {renderQuestionCard(
          'injectionDate',
          <div className="space-y-3">
            <Input
              type="date"
              value={injectionDate}
              onChange={(e) => setInjectionDate(e.target.value)}
              max={today}
              className="text-lg py-6"
            />
            <Button
              onClick={() => goToNext('injectionDate')}
              disabled={!injectionDate}
              className="w-full"
              variant="outline"
            >
              Continue
            </Button>
          </div>
        )}
        {/* Q8: Dose */}
        {renderQuestionCard(
          'dose',
          <div className="grid grid-cols-3 gap-2">
            {VALID_DOSES.map((dose) => (
              <button
                key={dose}
                onClick={() => {
                  setDoseMg(dose);
                  goToNext('dose');
                }}
                className={cn(
                  'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                  doseMg === dose
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-border hover:border-violet-500/50'
                )}
              >
                <span className="text-xl font-bold">{dose}</span>
                <span className="text-xs text-muted-foreground">mg</span>
              </button>
            ))}
          </div>
        )}
        {/* Q9: Injection Site */}
        {renderQuestionCard(
          'site',
          <div className="grid grid-cols-2 gap-2">
            {INJECTION_SITES.map((site) => {
              const isLeft = site.includes('left');
              const bodyPart = site.split('_')[0];
              const colorClass =
                bodyPart === 'abdomen'
                  ? 'bg-violet-500/15 text-violet-500'
                  : bodyPart === 'thigh'
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-amber-500/15 text-amber-500';
              return (
                <button
                  key={site}
                  onClick={() => {
                    setInjectionSite(site);
                    goToNext('site');
                  }}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    injectionSite === site
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-border hover:border-violet-500/50'
                  )}
                >
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', colorClass)}>
                    {isLeft ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium">{INJECTION_SITE_LABELS[site]}</span>
                </button>
              );
            })}
          </div>
        )}
        {/* Completion Card */}
        <div
          ref={(el) => {
            questionRefs.current['complete'] = el;
          }}
          className={cn(
            'transition-all duration-300',
            currentQuestion !== 'complete' && 'opacity-40 scale-[0.98]'
          )}
        >
          <Card
            className={cn(
              'border-2 bg-gradient-to-br from-success/15 to-success/5',
              currentQuestion === 'complete' ? 'border-success shadow-lg' : 'border-success/30'
            )}
          >
            <CardContent className="p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20 mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">You&apos;re all set!</h2>
              <p className="text-muted-foreground mb-6">
                Your profile is ready. Let&apos;s start tracking your journey.
              </p>
              {submitError && (
                <Alert variant="destructive" className="mb-4 text-left">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!isComplete || isSubmitting}
                size="lg"
                className="w-full gap-2"
              >
                <Rocket className="h-5 w-5" />
                {isSubmitting ? 'Setting up...' : 'Start Tracking'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Fixed bottom progress */}
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border/50 mt-4">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-center text-muted-foreground mt-2">
          {currentQuestion === 'complete'
            ? 'Ready to start!'
            : `${QUESTION_CONFIG[currentQuestion as Exclude<QuestionId, 'complete'>]?.title ?? ''}`}
        </p>
      </div>
    </div>
  );
}
