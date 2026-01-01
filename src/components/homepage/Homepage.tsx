import Link from 'next/link';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    icon: '⚖️',
    title: 'Weight Tracking',
    description: 'Log daily weights and see trends',
  },
  {
    icon: '💉',
    title: 'Injection Reminders',
    description: 'Never miss a dose',
  },
  {
    icon: '📊',
    title: 'Progress Charts',
    description: 'Visualize your stats',
  },
];

export function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 px-safe pt-safe pb-safe">
        {/* Header */}
        <header className="pt-8 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">💉</span>
            <h1 className="text-2xl font-bold text-foreground">Mounjaro Tracker</h1>
          </div>
          <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            Free Forever
          </span>
        </header>

        {/* Hero Section */}
        <section className="py-12 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Track Your Mounjaro Journey
          </h2>
          <p className="text-muted-foreground mb-8">
            Monitor weight, injections, and progress on your Tirzepatide treatment.
          </p>

          <div className="space-y-4">
            <Link
              href="/register"
              className="block w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-center"
            >
              Get Started
            </Link>

            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-8">
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        {/* PWA Install Section */}
        <section className="py-8 border-t border-border text-center">
          <div className="text-3xl mb-3">📱</div>
          <h3 className="font-medium text-foreground mb-2">Install as App</h3>
          <p className="text-sm text-muted-foreground">
            Works offline &bull; No app store needed
            <br />
            Add to your home screen
          </p>
        </section>
      </div>
    </div>
  );
}
