'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch - must wait for client mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex gap-2">
        {themes.map((t) => (
          <div
            key={t.value}
            className="flex h-12 flex-1 items-center justify-center rounded-lg bg-card"
          >
            <t.icon className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            className={cn(
              'flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-card/80'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
