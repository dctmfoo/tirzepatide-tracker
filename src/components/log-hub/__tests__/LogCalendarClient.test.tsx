import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogCalendarClient } from '../LogCalendarClient';
import type { CalendarData } from '@/lib/data/calendar';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create calendar data
function createCalendarData(year: number, month: number): CalendarData {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      date: dateStr,
      hasWeight: day % 3 === 0, // Every 3rd day has weight
      hasInjection: day === 7, // Day 7 has injection
      hasLog: day % 2 === 0, // Every even day has log
      sideEffectsCount: 0,
    };
  });

  return {
    year,
    month,
    days,
    summary: {
      weightEntries: days.filter((d) => d.hasWeight).length,
      injections: days.filter((d) => d.hasInjection).length,
      logsCompleted: days.filter((d) => d.hasLog).length,
    },
  };
}

describe('LogCalendarClient', () => {
  const initialData = createCalendarData(2025, 1);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createCalendarData(2025, 2)),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial calendar data', () => {
    render(<LogCalendarClient initialData={initialData} />);

    expect(screen.getByText('January 2025')).toBeInTheDocument();
  });

  it('fetches new data when navigating to next month', async () => {
    render(<LogCalendarClient initialData={initialData} />);

    const nextButton = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/2025/2');
    });

    await waitFor(() => {
      expect(screen.getByText('February 2025')).toBeInTheDocument();
    });
  });

  it('fetches new data when navigating to previous month', async () => {
    render(<LogCalendarClient initialData={initialData} />);

    const prevButton = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/2024/12');
    });
  });

  it('handles year rollover when navigating forward from December', async () => {
    const decemberData = createCalendarData(2025, 12);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(createCalendarData(2026, 1)),
    });

    render(<LogCalendarClient initialData={decemberData} />);

    const nextButton = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/2026/1');
    });
  });

  it('handles year rollover when navigating backward from January', async () => {
    render(<LogCalendarClient initialData={initialData} />);

    const prevButton = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/calendar/2024/12');
    });
  });

  it('shows loading state while fetching', async () => {
    // Delay the fetch response
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve(createCalendarData(2025, 2)),
              }),
            100
          )
        )
    );

    const { container } = render(
      <LogCalendarClient initialData={initialData} />
    );

    const nextButton = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextButton);

    // Calendar should show loading state
    const calendarWrapper = container.querySelector('.pointer-events-none');
    expect(calendarWrapper).not.toBeNull();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('February 2025')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<LogCalendarClient initialData={initialData} />);

    const nextButton = screen.getByRole('button', { name: /next month/i });
    fireEvent.click(nextButton);

    // Should still show the calendar (month updates optimistically)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Month header updates optimistically to February, but data stays the same
    expect(screen.getByText('February 2025')).toBeInTheDocument();
    // Loading state should be cleared
    await waitFor(() => {
      const calendar = screen.getByText('February 2025').closest('div');
      expect(calendar?.parentElement).not.toHaveClass('opacity-50');
    });
  });
});
