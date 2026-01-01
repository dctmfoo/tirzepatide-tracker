'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/push';

type PushNotificationPromptProps = {
  onComplete: () => void;
};

type PlatformInfo = {
  isIOS: boolean;
  isStandalone: boolean;
  isReady: boolean;
};

export function PushNotificationPrompt({ onComplete }: PushNotificationPromptProps) {
  const { isSupported, isLoading, subscribeToPush, error } = usePushNotifications();
  const [attemptComplete, setAttemptComplete] = useState(false);

  // Platform detection must happen on client side only
  const [platform, setPlatform] = useState<PlatformInfo>({
    isIOS: false,
    isStandalone: false,
    isReady: false,
  });

  // Detect platform on mount (client-side only)
  useEffect(() => {
    const detectPlatform = () => {
      // iOS detection - check user agent (case insensitive)
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      // Standalone detection for iOS uses navigator.standalone
      // For other browsers, use display-mode media query
      const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean })
        .standalone;
      const iosStandalone = 'standalone' in window.navigator && navigatorStandalone === true;
      const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isStandalone = iosStandalone || displayModeStandalone;

      setPlatform({
        isIOS,
        isStandalone,
        isReady: true,
      });
    };

    // Schedule to next frame to avoid synchronous setState in effect
    const frameId = requestAnimationFrame(detectPlatform);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleEnable = async () => {
    const success = await subscribeToPush();
    setAttemptComplete(true);

    if (success) {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleContinueAnyway = () => {
    onComplete();
  };

  // Wait for platform detection to complete
  if (!platform.isReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // IMPORTANT: Check iOS Safari FIRST (before isSupported)
  // On iOS Safari, PushManager and Notification APIs don't exist until installed as PWA
  if (platform.isIOS && !platform.isStandalone) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <svg
            className="h-8 w-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Install App First</h2>
          <p className="mt-2 text-muted-foreground">
            To receive push notifications on iOS, you need to add this app to your home screen.
          </p>
        </div>

        <div className="rounded-xl bg-background-card p-4 text-left">
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                1
              </span>
              <span>
                Tap the <strong>Share</strong> button{' '}
                <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs">⎋</span> at
                the bottom of Safari
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                2
              </span>
              <span>
                Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                3
              </span>
              <span>
                Tap <strong>&quot;Add&quot;</strong> in the top right
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                4
              </span>
              <span>Open the app from your home screen and enable notifications</span>
            </li>
          </ol>
        </div>

        <button
          onClick={handleSkip}
          className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>

        <p className="text-xs text-muted-foreground">
          iOS requires apps to be installed for push notifications
        </p>
      </div>
    );
  }

  // Show message if push not supported (non-iOS browsers without support)
  if (!isSupported) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Push Not Available</h2>
          <p className="mt-2 text-muted-foreground">
            Push notifications are not supported in this browser. You can still use email reminders.
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground"
        >
          Continue
        </button>
      </div>
    );
  }

  // Default: Show enable button (Android, Desktop, iOS standalone)
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Stay on Track</h2>
        <p className="mt-2 text-muted-foreground">
          Get push notifications to remind you about your injections. Never miss a dose.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {attemptComplete && error ? (
          <button
            onClick={handleContinueAnyway}
            className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Continue without notifications
          </button>
        ) : (
          <>
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        You can always change this later in Settings
      </p>
    </div>
  );
}
