'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  SettingsSection,
  SettingsItem,
  ThemeToggle,
  ProfileCard,
  GoalsCard,
} from '@/components/settings';
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
import {
  Calendar,
  Clock,
  Scale,
  Bell,
  Moon,
  Download,
  Archive,
  HelpCircle,
  MessageSquare,
  FileText,
  Trash2,
} from 'lucide-react';

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
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-24" />

      {/* Profile card skeleton */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Goals card skeleton */}
      <Skeleton className="h-48 rounded-[1.25rem]" />

      {/* Settings sections skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-3 h-3 w-20" />
          <div className="divide-y divide-border/40 overflow-hidden rounded-[1.25rem] bg-card shadow-sm">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Get push notification status for display
  const { isSubscribed: isPushSubscribed, isLoading: isPushLoading } = usePushNotifications();

  // Get theme state
  const { theme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, prefsRes, notifRes, weightRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/preferences'),
        fetch('/api/notifications/preferences'),
        fetch('/api/weight/latest'),
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

      if (weightRes.ok) {
        const data = await weightRes.json();
        setCurrentWeight(data.weightKg);
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
    if (day === null) return 'Not set';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getReminderText = (timing: string | undefined): string => {
    switch (timing) {
      case '1_day_before':
        return '1 day before';
      case '2_days_before':
        return '2 days before';
      case 'same_day':
        return 'Same day';
      case 'none':
        return 'None';
      default:
        return '1 day before';
    }
  };

  const getUnitsText = (): string => {
    const weight = preferences?.weightUnit || 'kg';
    const height = preferences?.heightUnit === 'ft-in' ? 'ft/in' : 'cm';
    return `${weight}, ${height}`;
  };

  const getNotificationStatus = (): { text: string; enabled: boolean } => {
    if (isPushLoading) return { text: 'Checking...', enabled: false };

    const enabledNotifs: string[] = [];

    if (isPushSubscribed) {
      enabledNotifs.push('Push');
    }

    const injectionReminder = notificationPrefs.find((p) => p.notificationType === 'injection_reminder');
    const weeklySummary = notificationPrefs.find((p) => p.notificationType === 'weekly_summary');

    if (injectionReminder?.enabled || weeklySummary?.enabled) {
      enabledNotifs.push('Email');
    }

    if (enabledNotifs.length === 0) {
      return { text: 'Off', enabled: false };
    }

    return { text: 'On', enabled: true };
  };

  const getThemeText = (): string => {
    if (!themeMounted) return 'Loading...';
    if (theme === 'system') return 'System';
    return theme === 'dark' ? 'Dark' : 'Light';
  };

  // Get user display info - extract name from email if no name set
  const userEmail = session?.user?.email || '';
  const userName = session?.user?.name || extractNameFromEmail(userEmail);

  if (loading) {
    return <SettingsSkeleton />;
  }

  const notificationStatus = getNotificationStatus();

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4 pb-24">
      {/* Header */}
      <header>
        <h1 className="text-[1.625rem] font-bold tracking-tight text-foreground">Settings</h1>
      </header>

      {/* Profile Summary Card */}
      <ProfileCard
        name={userName}
        email={userEmail}
        age={profile?.age ?? null}
        gender={profile?.gender ?? null}
        height={formatHeight(profile?.heightCm ?? null)}
        startWeight={formatWeight(profile?.startingWeightKg ?? null)}
        onEdit={() => setActiveModal('personalInfo')}
      />

      {/* Goals Card */}
      <GoalsCard
        startWeight={profile?.startingWeightKg ?? null}
        currentWeight={currentWeight}
        goalWeight={profile?.goalWeightKg ?? null}
        weightUnit={preferences?.weightUnit || 'kg'}
        onEdit={() => setActiveModal('goals')}
      />

      {/* TREATMENT Section */}
      <SettingsSection title="Treatment">
        <SettingsItem
          label="Injection Day"
          icon={Calendar}
          iconColor="violet"
          value={getDayName(preferences?.preferredInjectionDay ?? null)}
          onClick={() => setActiveModal('injectionSchedule')}
        />
        <SettingsItem
          label="Reminder"
          icon={Clock}
          iconColor="amber"
          value={getReminderText(preferences?.reminderTiming)}
          onClick={() => setActiveModal('injectionSchedule')}
        />
      </SettingsSection>

      {/* PREFERENCES Section */}
      <SettingsSection title="Preferences">
        <SettingsItem
          label="Units"
          icon={Scale}
          iconColor="blue"
          value={getUnitsText()}
          onClick={() => setActiveModal('units')}
        />
        <SettingsItem
          label="Notifications"
          icon={Bell}
          iconColor="emerald"
          badge={
            notificationStatus.enabled
              ? { text: notificationStatus.text, variant: 'success' }
              : undefined
          }
          value={!notificationStatus.enabled ? notificationStatus.text : undefined}
          onClick={() => setActiveModal('notifications')}
        />
        <SettingsItem
          label="Theme"
          icon={Moon}
          iconColor="slate"
          value={getThemeText()}
          onClick={() => setActiveModal('appearance')}
        />
      </SettingsSection>

      {/* DATA Section */}
      <SettingsSection title="Data">
        <SettingsItem
          label="Export Data"
          sublabel="Text, JSON, or image"
          icon={Download}
          iconColor="blue"
          onClick={() => setActiveModal('export')}
        />
        <SettingsItem
          label="Download All"
          sublabel="Complete GDPR backup"
          icon={Archive}
          iconColor="slate"
          onClick={() => window.open('/api/export/full', '_blank')}
        />
      </SettingsSection>

      {/* SUPPORT Section */}
      <SettingsSection title="Support">
        <SettingsItem
          label="Help & FAQ"
          icon={HelpCircle}
          iconColor="default"
          onClick={() => {}}
        />
        <SettingsItem
          label="Send Feedback"
          icon={MessageSquare}
          iconColor="default"
          onClick={() => {}}
        />
        <SettingsItem
          label="Privacy & Terms"
          icon={FileText}
          iconColor="default"
          onClick={() => {}}
        />
      </SettingsSection>

      {/* DANGER ZONE Section */}
      <SettingsSection title="Danger Zone" danger>
        <SettingsItem
          label="Delete Account"
          sublabel="Permanently delete all data"
          icon={Trash2}
          iconColor="rose"
          danger
          onClick={() => setActiveModal('deleteAccount')}
        />
      </SettingsSection>

      {/* Log Out Button */}
      <button
        onClick={handleLogout}
        className="w-full rounded-xl bg-secondary py-3.5 font-medium text-card-foreground transition-colors hover:bg-secondary/80"
      >
        Log Out
      </button>

      {/* Version */}
      <p className="text-center text-[0.75rem] text-muted-foreground">Version 1.0.0</p>

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
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={inputStyles}
            placeholder="Enter age"
          />
        </FormField>

        <FormField label="Gender">
          <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputStyles}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        <FormField label="Height (cm)">
          <input
            type="number"
            min={50}
            max={300}
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className={inputStyles}
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
            min={20}
            max={500}
            step="0.1"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            className={inputStyles}
            placeholder="Enter starting weight"
          />
        </FormField>

        <FormField label={`Goal Weight (${weightUnit})`}>
          <input
            type="number"
            min={20}
            max={500}
            step="0.1"
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            className={inputStyles}
            placeholder="Enter goal weight"
          />
        </FormField>

        <FormField label="Treatment Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputStyles}
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
          <select value={preferredDay} onChange={(e) => setPreferredDay(e.target.value)} className={inputStyles}>
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Reminder Timing">
          <select
            value={reminderTiming}
            onChange={(e) => setReminderTiming(e.target.value)}
            className={inputStyles}
          >
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
          <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className={inputStyles}>
            <option value="kg">Kilograms (kg)</option>
            <option value="lbs">Pounds (lbs)</option>
            <option value="stone">Stone</option>
          </select>
        </FormField>

        <FormField label="Height">
          <select value={heightUnit} onChange={(e) => setHeightUnit(e.target.value)} className={inputStyles}>
            <option value="cm">Centimeters (cm)</option>
            <option value="ft-in">Feet & Inches</option>
          </select>
        </FormField>

        <FormField label="Date Format">
          <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className={inputStyles}>
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
  const getInitialValue = (type: string) =>
    notificationPrefs.find((p) => p.notificationType === type)?.enabled ?? true;

  const [injectionReminder, setInjectionReminder] = useState(getInitialValue('injection_reminder'));
  const [weeklySummary, setWeeklySummary] = useState(getInitialValue('weekly_summary'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="rounded-lg border border-border bg-card p-4">
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
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <p className="font-medium text-foreground">Email Reminders</p>
            <p className="text-sm text-muted-foreground">Get injection reminders via email</p>
          </div>
          <Checkbox
            checked={injectionReminder}
            onCheckedChange={(checked) => setInjectionReminder(checked === true)}
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-4">
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
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Text Format</p>
            <p className="text-sm text-muted-foreground">Human-readable summary</p>
          </div>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => window.open('/api/export/json', '_blank')}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">JSON Format</p>
            <p className="text-sm text-muted-foreground">Machine-readable data</p>
          </div>
          <span className="text-muted-foreground">{'{ }'}</span>
        </button>

        <button
          onClick={() => window.open('/api/export/image', '_blank')}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Image Format</p>
            <p className="text-sm text-muted-foreground">Shareable progress card</p>
          </div>
          <Download className="h-5 w-5 text-muted-foreground" />
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
            className={inputStyles}
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

// Shared input styles for consistency
const inputStyles =
  'w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

// Reusable Form Field
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

// Extract a display name from email address
function extractNameFromEmail(email: string): string {
  if (!email) return 'User';
  const localPart = email.split('@')[0];
  // Replace dots, underscores, hyphens with spaces and capitalize each word
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
