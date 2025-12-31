'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
type SideEffect = {
  id?: string;
  effectType: string;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
};

type ActivityData = {
  workoutType?: string;
  durationMinutes?: number;
  steps?: number;
  notes?: string;
};

type MentalData = {
  motivationLevel?: string;
  cravingsLevel?: string;
  moodLevel?: string;
  notes?: string;
};

type DietData = {
  hungerLevel?: string;
  mealsCount?: number;
  proteinGrams?: number;
  waterLiters?: number;
  notes?: string;
};

type ExistingLog = {
  id: string;
  logDate: string;
  sideEffects: SideEffect[];
  activity: ActivityData | null;
  mental: MentalData | null;
  diet: DietData | null;
};

// Constants
const SIDE_EFFECT_TYPES = [
  'Nausea',
  'Fatigue',
  'Diarrhea',
  'Constipation',
  'Headache',
  'Dizziness',
  'Injection site reaction',
  'Loss of appetite',
  'Acid reflux',
  'Other',
] as const;

const SEVERITY_LEVELS = ['None', 'Mild', 'Moderate', 'Severe'] as const;
const WORKOUT_TYPES = ['Strength training', 'Cardio', 'Walking', 'Rest day', 'Other'] as const;
const MOTIVATION_LEVELS = ['Low', 'Medium', 'High'] as const;
const CRAVINGS_LEVELS = ['None', 'Low', 'Medium', 'High', 'Intense'] as const;
const MOOD_LEVELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;
const HUNGER_LEVELS = ['None', 'Low', 'Moderate', 'High', 'Intense'] as const;

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default function LogPage() {
  const router = useRouter();
  const [logDate] = useState(getTodayString());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Section states
  const [activeSection, setActiveSection] = useState<string | null>('diet');

  // Diet state
  const [hungerLevel, setHungerLevel] = useState<string>('');
  const [mealsCount, setMealsCount] = useState<string>('');
  const [proteinGrams, setProteinGrams] = useState<string>('');
  const [waterLiters, setWaterLiters] = useState<string>('');
  const [dietNotes, setDietNotes] = useState('');

  // Activity state
  const [workoutType, setWorkoutType] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [steps, setSteps] = useState<string>('');
  const [activityNotes, setActivityNotes] = useState('');

  // Mental state
  const [motivationLevel, setMotivationLevel] = useState<string>('');
  const [cravingsLevel, setCravingsLevel] = useState<string>('');
  const [moodLevel, setMoodLevel] = useState<string>('');
  const [mentalNotes, setMentalNotes] = useState('');

  // Side effects state
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);

  // Fetch existing log for today
  const fetchExistingLog = useCallback(async () => {
    try {
      const response = await fetch(`/api/daily-logs/${logDate}`);
      if (response.ok) {
        const data: ExistingLog = await response.json();

        // Populate diet
        if (data.diet) {
          setHungerLevel(data.diet.hungerLevel || '');
          setMealsCount(data.diet.mealsCount?.toString() || '');
          setProteinGrams(data.diet.proteinGrams?.toString() || '');
          setWaterLiters(data.diet.waterLiters?.toString() || '');
          setDietNotes(data.diet.notes || '');
        }

        // Populate activity
        if (data.activity) {
          setWorkoutType(data.activity.workoutType || '');
          setDurationMinutes(data.activity.durationMinutes?.toString() || '');
          setSteps(data.activity.steps?.toString() || '');
          setActivityNotes(data.activity.notes || '');
        }

        // Populate mental
        if (data.mental) {
          setMotivationLevel(data.mental.motivationLevel || '');
          setCravingsLevel(data.mental.cravingsLevel || '');
          setMoodLevel(data.mental.moodLevel || '');
          setMentalNotes(data.mental.notes || '');
        }

        // Populate side effects
        if (data.sideEffects && data.sideEffects.length > 0) {
          setSideEffects(data.sideEffects);
        }
      }
    } catch {
      // No existing log, that's fine
    } finally {
      setLoading(false);
    }
  }, [logDate]);

  useEffect(() => {
    fetchExistingLog();
  }, [fetchExistingLog]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const body: {
        logDate: string;
        diet?: DietData;
        activity?: ActivityData;
        mental?: MentalData;
        sideEffects?: SideEffect[];
      } = { logDate };

      // Add diet if any field is filled
      if (hungerLevel || mealsCount || proteinGrams || waterLiters || dietNotes) {
        body.diet = {
          hungerLevel: hungerLevel || undefined,
          mealsCount: mealsCount ? parseInt(mealsCount) : undefined,
          proteinGrams: proteinGrams ? parseInt(proteinGrams) : undefined,
          waterLiters: waterLiters ? parseFloat(waterLiters) : undefined,
          notes: dietNotes || undefined,
        };
      }

      // Add activity if any field is filled
      if (workoutType || durationMinutes || steps || activityNotes) {
        body.activity = {
          workoutType: workoutType || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          steps: steps ? parseInt(steps) : undefined,
          notes: activityNotes || undefined,
        };
      }

      // Add mental if any field is filled
      if (motivationLevel || cravingsLevel || moodLevel || mentalNotes) {
        body.mental = {
          motivationLevel: motivationLevel || undefined,
          cravingsLevel: cravingsLevel || undefined,
          moodLevel: moodLevel || undefined,
          notes: mentalNotes || undefined,
        };
      }

      // Add side effects
      if (sideEffects.length > 0) {
        body.sideEffects = sideEffects.map((se) => ({
          effectType: se.effectType,
          severity: se.severity,
          notes: se.notes,
        }));
      }

      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save log');
      }

      setSuccessMessage('Log saved successfully!');
      setTimeout(() => {
        router.push('/summary');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addSideEffect = () => {
    setSideEffects([...sideEffects, { effectType: '', severity: 'Mild' }]);
  };

  const removeSideEffect = (index: number) => {
    setSideEffects(sideEffects.filter((_, i) => i !== index));
  };

  const updateSideEffect = (index: number, field: keyof SideEffect, value: string) => {
    const updated = [...sideEffects];
    updated[index] = { ...updated[index], [field]: value };
    setSideEffects(updated);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Calculate completion status
  const hasDiet = !!(hungerLevel || mealsCount || proteinGrams || waterLiters);
  const hasActivity = !!(workoutType || steps || durationMinutes);
  const hasMental = !!(motivationLevel || cravingsLevel || moodLevel);
  const hasSideEffects = sideEffects.length > 0 && sideEffects.some((se) => se.effectType);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-8 w-40 rounded bg-background-card" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-background-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Daily Log</h1>
          <span className="text-sm text-foreground-muted">
            {new Date(logDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground-muted">Track your daily wellness</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mx-4 mb-4 rounded-lg bg-success/20 p-3 text-success">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mx-4 mb-4 rounded-lg bg-error/20 p-3 text-error">
          {error}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3 px-4">
        {/* Diet Section */}
        <CollapsibleSection
          title="Diet & Nutrition"
          icon="🍽️"
          isOpen={activeSection === 'diet'}
          isComplete={hasDiet}
          onToggle={() => toggleSection('diet')}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Hunger Level</label>
              <div className="flex flex-wrap gap-2">
                {HUNGER_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setHungerLevel(hungerLevel === level ? '' : level)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      hungerLevel === level
                        ? 'bg-accent-primary text-background'
                        : 'bg-background text-foreground hover:bg-background/80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Meals</label>
                <input
                  type="number"
                  value={mealsCount}
                  onChange={(e) => setMealsCount(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="10"
                  className="w-full rounded-lg bg-background px-3 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Protein (g)</label>
                <input
                  type="number"
                  value={proteinGrams}
                  onChange={(e) => setProteinGrams(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg bg-background px-3 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Water (L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="10"
                  className="w-full rounded-lg bg-background px-3 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-foreground-muted">Notes</label>
              <textarea
                value={dietNotes}
                onChange={(e) => setDietNotes(e.target.value)}
                placeholder="Any diet notes..."
                rows={2}
                className="w-full resize-none rounded-lg bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Activity Section */}
        <CollapsibleSection
          title="Activity"
          icon="🏃"
          isOpen={activeSection === 'activity'}
          isComplete={hasActivity}
          onToggle={() => toggleSection('activity')}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Workout Type</label>
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWorkoutType(workoutType === type ? '' : type)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      workoutType === type
                        ? 'bg-accent-primary text-background'
                        : 'bg-background text-foreground hover:bg-background/80'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Duration (min)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg bg-background px-3 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Steps</label>
                <input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg bg-background px-3 py-2 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-foreground-muted">Notes</label>
              <textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Any activity notes..."
                rows={2}
                className="w-full resize-none rounded-lg bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Mental Section */}
        <CollapsibleSection
          title="Mental Wellness"
          icon="🧠"
          isOpen={activeSection === 'mental'}
          isComplete={hasMental}
          onToggle={() => toggleSection('mental')}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Motivation</label>
              <div className="flex gap-2">
                {MOTIVATION_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMotivationLevel(motivationLevel === level ? '' : level)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                      motivationLevel === level
                        ? 'bg-accent-primary text-background'
                        : 'bg-background text-foreground hover:bg-background/80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Cravings</label>
              <div className="flex flex-wrap gap-2">
                {CRAVINGS_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setCravingsLevel(cravingsLevel === level ? '' : level)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      cravingsLevel === level
                        ? 'bg-accent-primary text-background'
                        : 'bg-background text-foreground hover:bg-background/80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOOD_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMoodLevel(moodLevel === level ? '' : level)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      moodLevel === level
                        ? 'bg-accent-primary text-background'
                        : 'bg-background text-foreground hover:bg-background/80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-foreground-muted">Notes</label>
              <textarea
                value={mentalNotes}
                onChange={(e) => setMentalNotes(e.target.value)}
                placeholder="Any mental wellness notes..."
                rows={2}
                className="w-full resize-none rounded-lg bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Side Effects Section */}
        <CollapsibleSection
          title="Side Effects"
          icon="⚠️"
          isOpen={activeSection === 'sideEffects'}
          isComplete={hasSideEffects}
          onToggle={() => toggleSection('sideEffects')}
        >
          <div className="space-y-4">
            {sideEffects.map((se, index) => (
              <div key={index} className="rounded-lg bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Effect {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSideEffect(index)}
                    className="text-error hover:text-error/80"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <select
                    value={se.effectType}
                    onChange={(e) => updateSideEffect(index, 'effectType', e.target.value)}
                    className="w-full rounded-lg bg-background-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  >
                    <option value="">Select type...</option>
                    {SIDE_EFFECT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    {SEVERITY_LEVELS.map((severity) => (
                      <button
                        key={severity}
                        type="button"
                        onClick={() => updateSideEffect(index, 'severity', severity)}
                        className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                          se.severity === severity
                            ? severity === 'Severe'
                              ? 'bg-error text-white'
                              : severity === 'Moderate'
                              ? 'bg-warning text-background'
                              : 'bg-accent-primary text-background'
                            : 'bg-background-card text-foreground hover:bg-background-card/80'
                        }`}
                      >
                        {severity}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSideEffect}
              className="w-full rounded-lg border-2 border-dashed border-foreground-muted/30 py-3 text-sm text-foreground-muted hover:border-accent-primary hover:text-accent-primary"
            >
              + Add Side Effect
            </button>
          </div>
        </CollapsibleSection>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-accent-primary py-4 font-medium text-background shadow-lg hover:bg-accent-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Daily Log'}
        </button>
      </div>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  isOpen,
  isComplete,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-background-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-foreground">{title}</span>
          {isComplete && (
            <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">
              ✓
            </span>
          )}
        </div>
        <span className={`text-foreground-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className="border-t border-foreground-muted/10 p-4">{children}</div>}
    </div>
  );
}
