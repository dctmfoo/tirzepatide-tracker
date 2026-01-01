'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-bold mb-4">You&apos;re offline</h1>
      <p className="text-foreground-muted text-center mb-6 max-w-md">
        Please check your internet connection to access Mounjaro Tracker.
        Your data is safe and will sync when you&apos;re back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-accent-primary text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}
