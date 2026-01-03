import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogCalendarGrid } from '../LogCalendarGrid';

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

// Helper to create day data
function createDays(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      date: dateStr,
      hasWeight: false,
      hasInjection: false,
      hasLog: false,
    };
  });
}

describe('LogCalendarGrid', () => {
  const mockPrevMonth = vi.fn();
  const mockNextMonth = vi.fn();

  const baseProps = {
    year: 2025,
    month: 1,
    days: createDays(2025, 1),
    onPrevMonth: mockPrevMonth,
    onNextMonth: mockNextMonth,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to January 15, 2025
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Month Navigation', () => {
    it('renders month and year in header', () => {
      render(<LogCalendarGrid {...baseProps} />);

      expect(screen.getByText('January 2025')).toBeInTheDocument();
    });

    it('calls onPrevMonth when previous button is clicked', () => {
      render(<LogCalendarGrid {...baseProps} />);

      const prevButton = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevButton);

      expect(mockPrevMonth).toHaveBeenCalledTimes(1);
    });

    it('calls onNextMonth when next button is clicked', () => {
      render(<LogCalendarGrid {...baseProps} />);

      const nextButton = screen.getByRole('button', { name: /next month/i });
      fireEvent.click(nextButton);

      expect(mockNextMonth).toHaveBeenCalledTimes(1);
    });
  });

  describe('Weekday Headers', () => {
    it('renders all weekday headers', () => {
      render(<LogCalendarGrid {...baseProps} />);

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });
  });

  describe('Day Cells', () => {
    it('renders all days of the month', () => {
      render(<LogCalendarGrid {...baseProps} />);

      // January 2025 has 31 days
      for (let day = 1; day <= 31; day++) {
        expect(screen.getByText(String(day))).toBeInTheDocument();
      }
    });

    it('renders day links for past and current dates', () => {
      render(<LogCalendarGrid {...baseProps} />);

      // Day 10 should be a link (past date)
      const dayLink = screen.getByRole('link', { name: '10' });
      expect(dayLink).toHaveAttribute('href', '/log/2025-01-10');
    });

    it('highlights today with special styling', () => {
      render(<LogCalendarGrid {...baseProps} />);

      // Today is January 15
      const todayCell = screen.getByText('15').closest('div');
      expect(todayCell).toHaveClass('bg-gradient-to-br');
    });

    it('disables future dates', () => {
      render(<LogCalendarGrid {...baseProps} />);

      // Day 20 is in the future (current date is Jan 15)
      const futureDay = screen.getByText('20');
      const parentLink = futureDay.closest('a');
      expect(parentLink).toBeNull(); // Future dates are not wrapped in links
    });
  });

  describe('Activity Indicators', () => {
    it('displays blue dot for weight entry', () => {
      const daysWithWeight = baseProps.days.map((day) =>
        day.date === '2025-01-10' ? { ...day, hasWeight: true } : day
      );

      render(<LogCalendarGrid {...baseProps} days={daysWithWeight} />);

      const weightIndicator = screen.getByTitle('Weight logged');
      expect(weightIndicator).toHaveClass('bg-blue-500');
    });

    it('displays green dot for check-in', () => {
      const daysWithLog = baseProps.days.map((day) =>
        day.date === '2025-01-10' ? { ...day, hasLog: true } : day
      );

      render(<LogCalendarGrid {...baseProps} days={daysWithLog} />);

      const logIndicator = screen.getByTitle('Check-in logged');
      expect(logIndicator).toHaveClass('bg-emerald-500');
    });

    it('displays violet dot for injection', () => {
      const daysWithInjection = baseProps.days.map((day) =>
        day.date === '2025-01-10' ? { ...day, hasInjection: true } : day
      );

      render(<LogCalendarGrid {...baseProps} days={daysWithInjection} />);

      const injectionIndicator = screen.getByTitle('Injection logged');
      expect(injectionIndicator).toHaveClass('bg-violet-500');
    });

    it('displays multiple dots when day has multiple activities', () => {
      const daysWithAll = baseProps.days.map((day) =>
        day.date === '2025-01-10'
          ? { ...day, hasWeight: true, hasLog: true, hasInjection: true }
          : day
      );

      render(<LogCalendarGrid {...baseProps} days={daysWithAll} />);

      expect(screen.getByTitle('Weight logged')).toBeInTheDocument();
      expect(screen.getByTitle('Check-in logged')).toBeInTheDocument();
      expect(screen.getByTitle('Injection logged')).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('renders legend with all indicator types', () => {
      render(<LogCalendarGrid {...baseProps} />);

      expect(screen.getByText('Weight')).toBeInTheDocument();
      expect(screen.getByText('Check-in')).toBeInTheDocument();
      expect(screen.getByText('Injection')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('applies loading styles when loading is true', () => {
      const { container } = render(
        <LogCalendarGrid {...baseProps} loading={true} />
      );

      const calendarWrapper = container.firstChild;
      expect(calendarWrapper).toHaveClass('pointer-events-none');
      expect(calendarWrapper).toHaveClass('opacity-50');
    });

    it('does not apply loading styles when loading is false', () => {
      const { container } = render(
        <LogCalendarGrid {...baseProps} loading={false} />
      );

      const calendarWrapper = container.firstChild;
      expect(calendarWrapper).not.toHaveClass('pointer-events-none');
      expect(calendarWrapper).not.toHaveClass('opacity-50');
    });
  });

  describe('Different Months', () => {
    it('correctly renders February with 28 days', () => {
      const febDays = createDays(2025, 2);

      render(
        <LogCalendarGrid
          {...baseProps}
          month={2}
          days={febDays}
        />
      );

      expect(screen.getByText('February 2025')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.queryByText('29')).not.toBeInTheDocument();
    });

    it('correctly renders December', () => {
      const decDays = createDays(2025, 12);

      render(
        <LogCalendarGrid
          {...baseProps}
          month={12}
          days={decDays}
        />
      );

      expect(screen.getByText('December 2025')).toBeInTheDocument();
      expect(screen.getByText('31')).toBeInTheDocument();
    });
  });

  describe('Today Indicator on Today', () => {
    it('uses white dots for today with activity', () => {
      const daysWithTodayActivity = baseProps.days.map((day) =>
        day.date === '2025-01-15'
          ? { ...day, hasWeight: true, hasLog: true }
          : day
      );

      render(<LogCalendarGrid {...baseProps} days={daysWithTodayActivity} />);

      // Today's indicators should have white background for contrast
      const todayWeightDot = screen.getAllByTitle('Weight logged')[0];
      expect(todayWeightDot).toHaveClass('bg-white/90');
    });
  });
});
