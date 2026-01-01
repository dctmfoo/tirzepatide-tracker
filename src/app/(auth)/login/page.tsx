'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/summary');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="Enter your password"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg py-3"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
