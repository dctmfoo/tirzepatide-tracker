'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { SettingsSection, SettingsItem, ThemeToggle } from '@/components/settings';
import { usePushNotifications } from '@/lib/push';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

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
  theme: string;
};

type NotificationPreference = {
  notificationType: string;
  enabled: boolean;
  description: string;
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="rounded-xl p-4">
            <div className="space-y-1">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-12 bg-background/50" />
              ))}
            </div>
          </Skeleton>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Get push notification status for display
  const { isSubscribed: isPushSubscribed, isLoading: isPushLoading } = usePushNotifications();

  // Get theme state
  const { theme, resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, prefsRes, notifRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/preferences'),
        fetch('/api/notifications/preferences'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPreferences(data);
      }

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotificationPrefs(data.preferences || []);
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

  const getNotificationStatusText = (): string => {
    if (isPushLoading) return 'Checking...';

    const enabledNotifs: string[] = [];

    if (isPushSubscribed) {
      enabledNotifs.push('Push');
    }

    // Check email-based notifications (injection_reminder uses email, weekly_summary)
    const injectionReminder = notificationPrefs.find((p) => p.notificationType === 'injection_reminder');
    const weeklySummary = notificationPrefs.find((p) => p.notificationType === 'weekly_summary');

    if (injectionReminder?.enabled || weeklySummary?.enabled) {
      enabledNotifs.push('Email');
    }

    if (enabledNotifs.length === 0) {
      return 'Disabled';
    }

    return `${enabledNotifs.join(' & ')} enabled`;
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
          sublabel={getNotificationStatusText()}
          onClick={() => setActiveModal('notifications')}
        />
        <SettingsItem
          label="Appearance"
          sublabel={`Theme: ${themeMounted ? (theme === 'system' ? `System (${resolvedTheme})` : theme) : 'Loading...'}`}
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
        <Button
          onClick={handleLogout}
          variant="secondary"
          className="w-full rounded-xl py-3"
        >
          Log Out
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">App Version 1.0.0</p>
      </div>

      {/* Modals */}
      <PersonalInfoModal
        profile={profile}
        open={activeModal === 'personalInfo'}
        onOpenChange={(open) => !open && handleModalClose()}
        onSave={handleSave}
      />

      <GoalsModal
        profile={profile}
        weightUnit={preferences?.weightUnit || 'kg'}
        open={activeModal === 'goals'}
        onOpenChange={(open) => !open && handleModalClose()}
        onSave={handleSave}
      />

      <InjectionScheduleModal
        preferences={preferences}
        open={activeModal === 'injectionSchedule'}
        onOpenChange={(open) => !open && handleModalClose()}
        onSave={handleSave}
      />

      <UnitsModal
        preferences={preferences}
        open={activeModal === 'units'}
        onOpenChange={(open) => !open && handleModalClose()}
        onSave={handleSave}
      />

      <NotificationsModal
        notificationPrefs={notificationPrefs}
        open={activeModal === 'notifications'}
        onOpenChange={(open) => !open && handleModalClose()}
        onSave={handleSave}
      />

      <AppearanceModal
        open={activeModal === 'appearance'}
        onOpenChange={(open) => !open && handleModalClose()}
      />

      <ExportModal
        open={activeModal === 'export'}
        onOpenChange={(open) => !open && handleModalClose()}
      />

      <DeleteAccountModal
        open={activeModal === 'deleteAccount'}
        onOpenChange={(open) => !open && handleModalClose()}
      />
    </div>
  );
}

// Personal Info Modal
function PersonalInfoModal({
  profile,
  open,
  onOpenChange,
  onSave,
}: {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <Modal title="Personal Info" open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Age">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter height in cm"
          />
        </FormField>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={saving} className="w-full rounded-xl py-3">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}

// Goals Modal
function GoalsModal({
  profile,
  weightUnit,
  open,
  onOpenChange,
  onSave,
}: {
  profile: Profile | null;
  weightUnit: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <Modal title="Goals" open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label={`Starting Weight (${weightUnit})`}>
          <input
            type="number"
            step="0.1"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter starting weight"
          />
        </FormField>

        <FormField label={`Goal Weight (${weightUnit})`}>
          <input
            type="number"
            step="0.1"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter goal weight"
          />
        </FormField>

        <FormField label="Treatment Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </FormField>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={saving} className="w-full rounded-xl py-3">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}

// Injection Schedule Modal
function InjectionScheduleModal({
  preferences,
  open,
  onOpenChange,
  onSave,
}: {
  preferences: Preferences | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <Modal title="Injection Schedule" open={open} onOpenChange={onOpenChange}>
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={saving} className="w-full rounded-xl py-3">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}

// Units Modal
function UnitsModal({
  preferences,
  open,
  onOpenChange,
  onSave,
}: {
  preferences: Preferences | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <Modal title="Units" open={open} onOpenChange={onOpenChange}>
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={saving} className="w-full rounded-xl py-3">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}

// Notifications Modal
function NotificationsModal({
  notificationPrefs,
  open,
  onOpenChange,
  onSave,
}: {
  notificationPrefs: NotificationPreference[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  // Get initial values from props
  const getInitialValue = (type: string) =>
    notificationPrefs.find((p) => p.notificationType === type)?.enabled ?? true;

  const [injectionReminder, setInjectionReminder] = useState(getInitialValue('injection_reminder'));
  const [weeklySummary, setWeeklySummary] = useState(getInitialValue('weekly_summary'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when props change
  useEffect(() => {
    setInjectionReminder(getInitialValue('injection_reminder'));
    setWeeklySummary(getInitialValue('weekly_summary'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationPrefs]);

  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    permission: pushPermission,
    error: pushError,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const handlePushToggle = async () => {
    if (isPushSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: [
            { notificationType: 'injection_reminder', enabled: injectionReminder },
            { notificationType: 'weekly_summary', enabled: weeklySummary },
          ],
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
    <Modal title="Notifications" open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Push Notifications Section */}
        <div className="rounded-lg bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                {!isPushSupported
                  ? 'Not supported in this browser'
                  : pushPermission === 'denied'
                    ? 'Blocked - enable in browser settings'
                    : 'Get injection reminders on this device'}
              </p>
            </div>
            <Switch
              checked={isPushSubscribed}
              onCheckedChange={handlePushToggle}
              disabled={!isPushSupported || isPushLoading || pushPermission === 'denied'}
            />
          </div>
          {pushError && <p className="mt-2 text-sm text-destructive">{pushError}</p>}
        </div>

        {/* Email Notifications */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg bg-card p-4">
          <div>
            <p className="font-medium text-foreground">Email Reminders</p>
            <p className="text-sm text-muted-foreground">Get injection reminders via email</p>
          </div>
          <Checkbox
            checked={injectionReminder}
            onCheckedChange={(checked) => setInjectionReminder(checked === true)}
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-lg bg-card p-4">
          <div>
            <p className="font-medium text-foreground">Weekly Report</p>
            <p className="text-sm text-muted-foreground">Receive weekly progress summary</p>
          </div>
          <Checkbox
            checked={weeklySummary}
            onCheckedChange={(checked) => setWeeklySummary(checked === true)}
          />
        </label>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={saving} className="w-full rounded-xl py-3">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Modal>
  );
}

// Appearance Modal
function AppearanceModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal title="Appearance" open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Theme</p>
          <ThemeToggle />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Choose how Mounjaro Tracker looks on your device
        </p>
      </div>
    </Modal>
  );
}

// Export Modal
function ExportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal title="Export Data" open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3">
        <button
          onClick={() => window.open('/api/export/text', '_blank')}
          className="flex w-full items-center justify-between rounded-lg bg-card p-4 hover:bg-card/80"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Text Format</p>
            <p className="text-sm text-muted-foreground">Human-readable summary</p>
          </div>
          <span className="text-muted-foreground">📄</span>
        </button>

        <button
          onClick={() => window.open('/api/export/json', '_blank')}
          className="flex w-full items-center justify-between rounded-lg bg-card p-4 hover:bg-card/80"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">JSON Format</p>
            <p className="text-sm text-muted-foreground">Machine-readable data</p>
          </div>
          <span className="text-muted-foreground">{ }</span>
        </button>

        <button
          onClick={() => window.open('/api/export/image', '_blank')}
          className="flex w-full items-center justify-between rounded-lg bg-card p-4 hover:bg-card/80"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Image Format</p>
            <p className="text-sm text-muted-foreground">Shareable progress card</p>
          </div>
          <span className="text-muted-foreground">🖼️</span>
        </button>
      </div>
    </Modal>
  );
}

// Delete Account Modal
function DeleteAccountModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    // TODO: Implement account deletion API
    alert('Account deletion is not yet implemented');
    setDeleting(false);
    onOpenChange(false);
  };

  return (
    <Modal title="Delete Account" open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <div className="rounded-lg bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            This action is permanent and cannot be undone. All your data will be permanently deleted.
          </p>
        </div>

        <FormField label="Type DELETE to confirm">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Type DELETE"
          />
        </FormField>

        <Button
          onClick={handleDelete}
          disabled={confirmText !== 'DELETE' || deleting}
          variant="destructive"
          className="w-full rounded-xl py-3"
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </div>
    </Modal>
  );
}

// Reusable Modal Component using ResponsiveModal (Dialog on desktop, Drawer on mobile)
function Modal({
  title,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{title}</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <div className="px-4 pb-4 sm:px-0 sm:pb-0">{children}</div>
      </ResponsiveModalContent>
    </ResponsiveModal>
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
