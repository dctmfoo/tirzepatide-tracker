'use client';

import Link from 'next/link';
import {
  Scale,
  Syringe,
  TrendingUp,
  Calendar,
  Bell,
  LineChart,
  Smartphone,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Scale,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    title: 'Weight Tracking',
    description: 'Log daily weights and visualize your progress over time',
  },
  {
    icon: Syringe,
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
    title: 'Injection Log',
    description: 'Track doses, rotation sites, and get smart reminders',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    title: 'Progress Charts',
    description: 'Beautiful charts to see your journey at a glance',
  },
  {
    icon: Calendar,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    title: 'Daily Logging',
    description: 'Track side effects, mood, diet, and activity',
  },
];

export function Homepage() {
  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-lg px-4 px-safe pb-safe pt-safe">
        {/* Hero Section */}
        <section className="relative flex min-h-[70svh] flex-col items-center justify-center py-8 text-center">
          {/* Background gradient effect */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Logo and Brand */}
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 shadow-lg shadow-primary/10">
                <Syringe className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Tirzepatide Tracker
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                For Mounjaro &amp; Zepbound
              </p>
            </div>

            {/* Free Badge */}
            <div className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <Sparkles className="h-3 w-3" />
              Free Forever
            </div>

            {/* Value Proposition */}
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
              Your Treatment Journey,
              <br />
              <span className="text-primary">Simplified</span>
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
              Monitor your weight, track injections, log side effects, and
              visualize your progress — all in one beautiful app.
            </p>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                asChild
              >
                <Link href="/register">Get Started Free</Link>
              </Button>

              <p className="text-sm text-muted-foreground">
                Already tracking?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-8">
          <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Everything You Need
          </h3>
          <div className="grid gap-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        {/* PWA Install Section */}
        <section className="py-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">
                  Install as App
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add to your home screen for the best experience. No app store
                  required.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <WifiOff className="h-3.5 w-3.5" />
                    Works offline
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="h-3.5 w-3.5" />
                    Push notifications
                  </span>
                  <span className="flex items-center gap-1">
                    <LineChart className="h-3.5 w-3.5" />
                    Native feel
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          <p>
            Not medical advice. Always consult your healthcare provider.
          </p>
        </footer>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: typeof Scale;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

function FeatureCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80 hover:bg-card/80">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
