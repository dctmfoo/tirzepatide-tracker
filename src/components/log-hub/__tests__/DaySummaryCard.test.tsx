import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DaySummaryCard } from '../DaySummaryCard';
import type { DayDetailsData } from '@/lib/data/day-details';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DaySummaryCard', () => {
  const baseData: DayDetailsData = {
    date: '2025-01-15',
    formattedDate: 'Wednesday, Jan 15',
    isToday: true,
    weight: null,
    injection: null,
    checkin: null,
    hasAnyData: false,
    allNotes: [],
  };

  describe('Empty State', () => {
    it('renders empty state when no data is present', () => {
      render(<DaySummaryCard data={baseData} />);

      expect(screen.getByText('No data logged')).toBeInTheDocument();
      expect(screen.getByText("You haven't logged anything today yet.")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Start Check-in/i })).toHaveAttribute(
        'href',
        '/log/checkin/2025-01-15'
      );
    });

    it('shows different message for past day with no data', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            isToday: false,
          }}
        />
      );

      expect(screen.getByText('Nothing was logged on this day.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Add Check-in/i })).toHaveAttribute(
        'href',
        '/log/checkin/2025-01-15'
      );
    });
  });

  describe('Weight Entry', () => {
    it('displays weight with value and time', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
            },
          }}
        />
      );

      expect(screen.getByText('Weight')).toBeInTheDocument();
      expect(screen.getByText('91.5 kg')).toBeInTheDocument();
      expect(screen.getByText(/8:30/i)).toBeInTheDocument();
    });

    it('displays weight delta when available (negative/loss)', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
              delta: -0.5,
            },
          }}
        />
      );

      expect(screen.getByText('-0.5 kg')).toBeInTheDocument();
    });

    it('displays weight delta when available (positive/gain)', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 92.0,
              recordedAt: new Date('2025-01-15T08:30:00'),
              delta: 0.5,
            },
          }}
        />
      );

      expect(screen.getByText('+0.5 kg')).toBeInTheDocument();
    });
  });

  describe('Injection Entry', () => {
    it('displays injection with dose and site', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            injection: {
              id: 'inj1',
              doseMg: 2.5,
              injectionSite: 'thigh-left',
              injectionDate: new Date('2025-01-15T09:00:00'),
              weekNumber: 4,
            },
          }}
        />
      );

      expect(screen.getByText('Injection')).toBeInTheDocument();
      expect(screen.getByText('2.5 mg')).toBeInTheDocument();
      expect(screen.getByText('Thigh Left')).toBeInTheDocument();
      expect(screen.getByText('Week 4')).toBeInTheDocument();
    });
  });

  describe('Check-in Summary', () => {
    it('displays check-in with mood tag', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            checkin: {
              id: 'log1',
              logDate: '2025-01-15',
              mental: {
                moodLevel: 'Good',
                cravingsLevel: 'Low',
              },
              diet: null,
              activity: null,
              sideEffects: [],
            },
          }}
        />
      );

      expect(screen.getByText('Check-in')).toBeInTheDocument();
      expect(screen.getByText('Good mood')).toBeInTheDocument();
      expect(screen.getByText('Low cravings')).toBeInTheDocument();
    });

    it('displays diet and activity tags', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            checkin: {
              id: 'log1',
              logDate: '2025-01-15',
              mental: null,
              diet: {
                mealsCount: 3,
              },
              activity: {
                workoutType: 'Walking',
                steps: 5200,
              },
              sideEffects: [],
            },
          }}
        />
      );

      expect(screen.getByText('3 meals')).toBeInTheDocument();
      expect(screen.getByText('Walking')).toBeInTheDocument();
      expect(screen.getByText('5.2k steps')).toBeInTheDocument();
    });

    it('links check-in card to edit page', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            checkin: {
              id: 'log1',
              logDate: '2025-01-15',
              mental: { moodLevel: 'Good' },
              diet: null,
              activity: null,
              sideEffects: [],
            },
          }}
        />
      );

      const checkinLink = screen.getByRole('link', { name: /Check-in/i });
      expect(checkinLink).toHaveAttribute('href', '/log/checkin/2025-01-15');
    });

    it('shows empty check-in prompt when no check-in data', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
            },
            checkin: null,
          }}
        />
      );

      expect(screen.getByText('Start check-in')).toBeInTheDocument();
      expect(screen.getByText('Log mood, diet, activity & more')).toBeInTheDocument();
    });
  });

  describe('Notes Section', () => {
    it('displays notes when present', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
              notes: 'Feeling great today!',
            },
            allNotes: ['Feeling great today!'],
          }}
        />
      );

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Feeling great today!')).toBeInTheDocument();
    });

    it('does not render notes section when no notes', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
            },
            allNotes: [],
          }}
        />
      );

      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Complete Status', () => {
    it('shows Complete badge when day has enough data', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
            },
            injection: {
              id: 'inj1',
              doseMg: 2.5,
              injectionSite: 'thigh-left',
              injectionDate: new Date('2025-01-15T09:00:00'),
              weekNumber: 4,
            },
            checkin: {
              id: 'log1',
              logDate: '2025-01-15',
              mental: { moodLevel: 'Good' },
              diet: { mealsCount: 3 },
              activity: null,
              sideEffects: [],
            },
          }}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('does not show Complete badge for incomplete day', () => {
      render(
        <DaySummaryCard
          data={{
            ...baseData,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.5,
              recordedAt: new Date('2025-01-15T08:30:00'),
            },
            checkin: null,
          }}
        />
      );

      expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    });
  });

  describe('Full Day Example', () => {
    it('renders all sections together', () => {
      render(
        <DaySummaryCard
          data={{
            date: '2025-01-15',
            formattedDate: 'Wednesday, Jan 15',
            isToday: false,
            hasAnyData: true,
            weight: {
              id: 'w1',
              weightKg: 91.2,
              recordedAt: new Date('2025-01-15T08:15:00'),
              delta: -0.3,
            },
            injection: {
              id: 'inj1',
              doseMg: 5.0,
              injectionSite: 'abdomen-right',
              injectionDate: new Date('2025-01-15T09:30:00'),
              weekNumber: 8,
            },
            checkin: {
              id: 'log1',
              logDate: '2025-01-15',
              mental: {
                moodLevel: 'Great',
                cravingsLevel: 'None',
                motivationLevel: 'High',
              },
              diet: {
                mealsCount: 4,
                proteinGrams: 120,
                waterLiters: 2.5,
                hungerLevel: 'Low',
              },
              activity: {
                workoutType: 'Cardio',
                durationMinutes: 45,
                steps: 12000,
              },
              sideEffects: [
                { effectType: 'Nausea', severity: 1 },
              ],
            },
            allNotes: ['Great workout today!', 'Hit my protein goal'],
          }}
        />
      );

      // Weight section
      expect(screen.getByText('91.2 kg')).toBeInTheDocument();
      expect(screen.getByText('-0.3 kg')).toBeInTheDocument();

      // Injection section
      expect(screen.getByText('5 mg')).toBeInTheDocument();
      expect(screen.getByText('Abdomen Right')).toBeInTheDocument();
      expect(screen.getByText('Week 8')).toBeInTheDocument();

      // Check-in tags
      expect(screen.getByText('Great mood')).toBeInTheDocument();
      expect(screen.getByText('None cravings')).toBeInTheDocument();
      expect(screen.getByText('4 meals')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
      expect(screen.getByText('12.0k steps')).toBeInTheDocument();

      // Notes
      expect(screen.getByText('Great workout today!')).toBeInTheDocument();
      expect(screen.getByText('Hit my protein goal')).toBeInTheDocument();

      // Complete badge
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });
});
