'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { SettingsSection, SettingsItem } from '@/components/settings';

type Profile = {
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  startingWeightKg: number | null;
  goalWeightKg: number | null;
  treatmentStartDate: string | null;
};

type Preferences = {
  weightUnit: string;
  heightUnit: string;
  dateFormat: string;
  weekStartsOn: string;
  preferredInjectionDay: number | null;
  reminderTiming: string;
  emailNotifications: boolean;
  weeklyReport: boolean;
  theme: string;
};

function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="mb-2 h-4 w-24 rounded bg-background-card" />
          <div className="space-y-1 rounded-xl bg-background-card p-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-12 rounded bg-background/50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/preferences'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModalClose = () => setActiveModal(null);

  const handleSave = () => {
    handleModalClose();
    fetchData();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const formatHeight = (cm: number | null): string => {
    if (!cm) return 'Not set';
    if (preferences?.heightUnit === 'ft-in') {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    }
    return `${cm} cm`;
  };

  const formatWeight = (kg: number | null): string => {
    if (!kg) return 'Not set';
    if (preferences?.weightUnit === 'lbs') {
      return `${(kg * 2.205).toFixed(1)} lbs`;
    }
    if (preferences?.weightUnit === 'stone') {
      const totalLbs = kg * 2.205;
      const stone = Math.floor(totalLbs / 14);
      const lbs = Math.round(totalLbs % 14);
      return `${stone}st ${lbs}lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  };

  const getDayName = (day: number | null): string => {
    if (day === null) return 'No preference';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="pb-24">
      {/* Page Header */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      {/* PROFILE Section */}
      <SettingsSection title="Profile">
        <SettingsItem
          label="Personal Info"
          sublabel={`Age: ${profile?.age || 'Not set'}, Gender: ${profile?.gender || 'Not set'}, Height: ${formatHeight(profile?.heightCm ?? null)}`}
          onClick={() => setActiveModal('personalInfo')}
        />
        <SettingsItem
          label="Goals"
          sublabel={`Start: ${formatWeight(profile?.startingWeightKg ?? null)}, Goal: ${formatWeight(profile?.goalWeightKg ?? null)}`}
          onClick={() => setActiveModal('goals')}
        />
        <SettingsItem
          label="Account"
          sublabel="Email, password"
          onClick={() => setActiveModal('account')}
        />
      </SettingsSection>

      {/* TREATMENT Section */}
      <SettingsSection title="Treatment">
        <SettingsItem
          label="Injection Schedule"
          sublabel={`Preferred day: ${getDayName(preferences?.preferredInjectionDay ?? null)}`}
          onClick={() => setActiveModal('injectionSchedule')}
        />
      </SettingsSection>

      {/* PREFERENCES Section */}
      <SettingsSection title="Preferences">
        <SettingsItem
          label="Units"
          sublabel={`Weight: ${preferences?.weightUnit || 'kg'}, Height: ${preferences?.heightUnit || 'cm'}`}
          onClick={() => setActiveModal('units')}
        />
        <SettingsItem
          label="Notifications"
          sublabel={preferences?.emailNotifications ? 'Email reminders enabled' : 'Disabled'}
          onClick={() => setActiveModal('notifications')}
        />
        <SettingsItem
          label="Appearance"
          sublabel={`Theme: ${preferences?.theme || 'dark'}`}
          onClick={() => setActiveModal('appearance')}
        />
      </SettingsSection>

      {/* DATA Section */}
      <SettingsSection title="Data">
        <SettingsItem
          label="Export Data"
          sublabel="Text, JSON, or image format"
          onClick={() => setActiveModal('export')}
        />
        <SettingsItem
          label="Download All Data"
          sublabel="Complete backup (GDPR export)"
          onClick={() => window.open('/api/export/full', '_blank')}
        />
      </SettingsSection>

      {/* SUPPORT Section */}
      <SettingsSection title="Support">
        <SettingsItem label="Help & FAQ" onClick={() => {}} />
        <SettingsItem label="Send Feedback" onClick={() => {}} />
        <SettingsItem label="Privacy Policy" onClick={() => {}} />
        <SettingsItem label="Terms of Service" onClick={() => {}} />
      </SettingsSection>

      {/* DANGER ZONE Section */}
      <SettingsSection title="Danger Zone" danger>
        <SettingsItem
          label="Delete Account"
          sublabel="Permanently delete all data"
          danger
          onClick={() => setActiveModal('deleteAccount')}
        />
      </SettingsSection>

      {/* Log Out Button */}
      <div className="px-4 py-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl bg-background-card py-3 font-medium text-foreground hover:bg-background-card/80"
        >
          Log Out
        </button>
        <p className="mt-4 text-center text-xs text-foreground-muted">App Version 1.0.0</p>
      </div>

      {/* Modals */}
      {activeModal === 'personalInfo' && (
        <PersonalInfoModal
          profile={profile}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {activeModal === 'goals' && (
        <GoalsModal
          profile={profile}
          weightUnit={preferences?.weightUnit || 'kg'}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {activeModal === 'injectionSchedule' && (
        <InjectionScheduleModal
          preferences={preferences}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {activeModal === 'units' && (
        <UnitsModal
          preferences={preferences}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {activeModal === 'notifications' && (
        <NotificationsModal
          preferences={preferences}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      {activeModal === 'export' && (
        <ExportModal onClose={handleModalClose} />
      )}

      {activeModal === 'deleteAccount' && (
        <DeleteAccountModal onClose={handleModalClose} />
      )}
    </div>
  );
}

// Personal Info Modal
function PersonalInfoModal({
  profile,
  onClose,
  onSave,
}: {
  profile: Profile | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [heightCm, setHeightCm] = useState(profile?.heightCm?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: age ? parseInt(age) : null,
          gender: gender || null,
          heightCm: heightCm ? parseFloat(heightCm) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      onSave();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Personal Info" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Age">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter age"
          />
        </FormField>

        <FormField label="Gender">
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        <FormField label="Height (cm)">
          <input
            type="number"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter height in cm"
          />
        </FormField>

        {error && <p className="text-sm text-error">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

// Goals Modal
function GoalsModal({
  profile,
  weightUnit,
  onClose,
  onSave,
}: {
  profile: Profile | null;
  weightUnit: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [startingWeight, setStartingWeight] = useState(profile?.startingWeightKg?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeightKg?.toString() || '');
  const [startDate, setStartDate] = useState(profile?.treatmentStartDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingWeightKg: startingWeight ? parseFloat(startingWeight) : null,
          goalWeightKg: goalWeight ? parseFloat(goalWeight) : null,
          treatmentStartDate: startDate || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      onSave();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Goals" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={`Starting Weight (${weightUnit})`}>
          <input
            type="number"
            step="0.1"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter starting weight"
          />
        </FormField>

        <FormField label={`Goal Weight (${weightUnit})`}>
          <input
            type="number"
            step="0.1"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Enter goal weight"
          />
        </FormField>

        <FormField label="Treatment Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </FormField>

        {error && <p className="text-sm text-error">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

// Injection Schedule Modal
function InjectionScheduleModal({
  preferences,
  onClose,
  onSave,
}: {
  preferences: Preferences | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [preferredDay, setPreferredDay] = useState<string>(
    preferences?.preferredInjectionDay?.toString() ?? ''
  );
  const [reminderTiming, setReminderTiming] = useState(preferences?.reminderTiming || '1_day_before');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredInjectionDay: preferredDay ? parseInt(preferredDay) : null,
          reminderTiming,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      onSave();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const days = [
    { value: '', label: 'No preference' },
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ];

  return (
    <Modal title="Injection Schedule" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Preferred Injection Day">
          <select value={preferredDay} onChange={(e) => setPreferredDay(e.target.value)} className="input">
            {days.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Reminder Timing">
          <select value={reminderTiming} onChange={(e) => setReminderTiming(e.target.value)} className="input">
            <option value="1_day_before">1 day before</option>
            <option value="2_days_before">2 days before</option>
            <option value="same_day">Same day</option>
            <option value="none">None</option>
          </select>
        </FormField>

        {error && <p className="text-sm text-error">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

// Units Modal
function UnitsModal({
  preferences,
  onClose,
  onSave,
}: {
  preferences: Preferences | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [weightUnit, setWeightUnit] = useState(preferences?.weightUnit || 'kg');
  const [heightUnit, setHeightUnit] = useState(preferences?.heightUnit || 'cm');
  const [dateFormat, setDateFormat] = useState(preferences?.dateFormat || 'DD/MM/YYYY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightUnit, heightUnit, dateFormat }),
      });

      if (!response.ok) throw new Error('Failed to save');
      onSave();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Units" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Weight">
          <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="input">
            <option value="kg">Kilograms (kg)</option>
            <option value="lbs">Pounds (lbs)</option>
            <option value="stone">Stone</option>
          </select>
        </FormField>

        <FormField label="Height">
          <select value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)} className="input">
            <option value="cm">Centimeters (cm)</option>
            <option value="ft-in">Feet & Inches</option>
          </select>
        </FormField>

        <FormField label="Date Format">
          <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="input">
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          </select>
        </FormField>

        {error && <p className="text-sm text-error">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

// Notifications Modal
function NotificationsModal({
  preferences,
  onClose,
  onSave,
}: {
  preferences: Preferences | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [emailNotifications, setEmailNotifications] = useState(preferences?.emailNotifications ?? true);
  const [weeklyReport, setWeeklyReport] = useState(preferences?.weeklyReport ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications, weeklyReport }),
      });

      if (!response.ok) throw new Error('Failed to save');
      onSave();
    } catch {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Notifications" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center justify-between rounded-lg bg-background-card p-4">
          <div>
            <p className="font-medium text-foreground">Email Reminders</p>
            <p className="text-sm text-foreground-muted">Get injection reminders via email</p>
          </div>
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-5 w-5 accent-accent-primary"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg bg-background-card p-4">
          <div>
            <p className="font-medium text-foreground">Weekly Report</p>
            <p className="text-sm text-foreground-muted">Receive weekly progress summary</p>
          </div>
          <input
            type="checkbox"
            checked={weeklyReport}
            onChange={(e) => setWeeklyReport(e.target.checked)}
            className="h-5 w-5 accent-accent-primary"
          />
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-accent-primary py-3 font-medium text-background hover:bg-accent-primary/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}

// Export Modal
function ExportModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Export Data" onClose={onClose}>
      <div className="space-y-3">
        <button
          onClick={() => window.open('/api/export/text', '_blank')}
          className="flex w-full items-center justify-between rounded-lg bg-background-card p-4 hover:bg-background-card/80"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Text Format</p>
            <p className="text-sm text-foreground-muted">Human-readable summary</p>
          </div>
          <span className="text-foreground-muted">📄</span>
        </button>

        <button
          onClick={() => window.open('/api/export/json', '_blank')}
          className="flex w-full items-center justify-between rounded-lg bg-background-card p-4 hover:bg-background-card/80"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">JSON Format</p>
            <p className="text-sm text-foreground-muted">Machine-readable data</p>
          </div>
          <span className="text-foreground-muted">{ }</span>
        </button>

        <button
          onClick={() => window.open('/api/export/image', '_blank')}
          className="flex w-full items-center justify-between rounded-lg bg-background-card p-4 hover:bg-background-card/80"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Image Format</p>
            <p className="text-sm text-foreground-muted">Shareable progress card</p>
          </div>
          <span className="text-foreground-muted">🖼️</span>
        </button>
      </div>
    </Modal>
  );
}

// Delete Account Modal
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    // TODO: Implement account deletion API
    alert('Account deletion is not yet implemented');
    setDeleting(false);
    onClose();
  };

  return (
    <Modal title="Delete Account" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-error/10 p-4">
          <p className="text-sm text-error">
            This action is permanent and cannot be undone. All your data will be permanently deleted.
          </p>
        </div>

        <FormField label="Type DELETE to confirm">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-lg bg-background-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-primary"
            placeholder="Type DELETE"
          />
        </FormField>

        <button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || deleting}
          className="w-full rounded-xl bg-error py-3 font-medium text-white hover:bg-error/90 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>
    </Modal>
  );
}

// Reusable Modal Component
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-background p-6 sm:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-foreground-muted hover:bg-background-card">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Reusable Form Field
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
