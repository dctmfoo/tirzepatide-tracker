'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Register the user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but sign-in failed, redirect to login
        router.push('/login');
      } else {
        // Redirect to onboarding for new users
        router.push('/onboarding');
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
        <h1 className="text-2xl font-bold text-foreground mb-2">Create account</h1>
        <p className="text-muted-foreground">Start tracking your Mounjaro journey</p>
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
          <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="At least 8 characters"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must contain uppercase, lowercase, and a number
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            placeholder="Confirm your password"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg py-3"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
