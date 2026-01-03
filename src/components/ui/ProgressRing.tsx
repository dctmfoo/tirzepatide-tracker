'use client';

import { useId } from 'react';

type ProgressRingProps = {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: 'solid' | 'gradient';
};

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 8,
  className = '',
  variant = 'gradient',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Stable unique ID for gradient to avoid conflicts when multiple rings are rendered
  const id = useId();
  const gradientId = `progress-gradient-${id}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          {/* Gradient that follows the arc: amber → olive → green */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" /> {/* amber-600 */}
            <stop offset="50%" stopColor="#84cc16" /> {/* lime-500 */}
            <stop offset="100%" stopColor="#22c55e" /> {/* green-500 */}
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={variant === 'gradient' ? `url(#${gradientId})` : 'currentColor'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={variant === 'solid' ? 'text-success transition-all duration-500 ease-out' : 'transition-all duration-500 ease-out'}
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">
        {Math.round(clampedValue)}%
      </span>
    </div>
  );
}
