import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  DOSES,
  INJECTION_SITES,
  getNextInjectionDue,
  getInjectionStatus,
  getSuggestedSite,
  getInjectionSiteOptions,
  getDoseOptions,
  getNextTitrationDose,
  isDoseIncreaseRecommended,
  calculateWeeksOnCurrentDose,
  formatDose,
  getInjectionStatusColor,
  getInjectionStatusMessage,
} from '../injection-logic';

describe('Injection Constants', () => {
  it('has correct dose levels', () => {
    expect(DOSES).toEqual([2.5, 5.0, 7.5, 10.0, 12.5, 15.0]);
  });

  it('has correct injection sites', () => {
    expect(INJECTION_SITES).toHaveLength(6);
    expect(INJECTION_SITES).toContain('Abdomen - Left');
    expect(INJECTION_SITES).toContain('Thigh - Right');
    expect(INJECTION_SITES).toContain('Upper Arm - Left');
  });
});

describe('Injection Scheduling', () => {
  describe('getNextInjectionDue', () => {
    it('returns date 7 days after last injection by default', () => {
      const lastInjection = new Date('2025-01-08');
      const expected = new Date('2025-01-15');
      const result = getNextInjectionDue(lastInjection);

      expect(result.toDateString()).toBe(expected.toDateString());
    });

    it('adjusts to preferred day within ±2 day window', () => {
      const lastInjection = new Date('2025-01-08'); // Wednesday
      // Base due: Jan 15 (Wednesday)
      // Preferred: Friday (5) = Jan 17, which is +2 days (within window)

      const result = getNextInjectionDue(lastInjection, 5); // Friday
      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(17);
    });

    it('does not adjust if preferred day is outside window', () => {
      const lastInjection = new Date('2025-01-08'); // Wednesday
      // Base due: Jan 15 (Wednesday)
      // Preferred: Sunday (0) = Jan 12 is -3 days, Jan 19 is +4 days - both outside window

      const result = getNextInjectionDue(lastInjection, 0); // Sunday
      expect(result.toDateString()).toBe(new Date('2025-01-15').toDateString());
    });

    it('handles undefined preferred day', () => {
      const lastInjection = new Date('2025-01-08');
      const result = getNextInjectionDue(lastInjection, undefined);

      expect(result.toDateString()).toBe(new Date('2025-01-15').toDateString());
    });
  });

  describe('getInjectionStatus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "upcoming" for days 1-5', () => {
      const lastInjection = new Date('2025-01-12'); // 3 days ago
      expect(getInjectionStatus(lastInjection)).toBe('upcoming');
    });

    it('returns "reminder" for day 6', () => {
      const lastInjection = new Date('2025-01-09'); // 6 days ago
      expect(getInjectionStatus(lastInjection)).toBe('reminder');
    });

    it('returns "due_today" for day 7', () => {
      const lastInjection = new Date('2025-01-08'); // 7 days ago
      expect(getInjectionStatus(lastInjection)).toBe('due_today');
    });

    it('returns "overdue" for day 8', () => {
      const lastInjection = new Date('2025-01-07'); // 8 days ago
      expect(getInjectionStatus(lastInjection)).toBe('overdue');
    });

    it('returns "alert" for day 9+', () => {
      const lastInjection = new Date('2025-01-05'); // 10 days ago
      expect(getInjectionStatus(lastInjection)).toBe('alert');
    });
  });
});

describe('Site Rotation', () => {
  describe('getSuggestedSite', () => {
    it('rotates through injection sites', () => {
      expect(getSuggestedSite('Abdomen - Left')).toBe('Abdomen - Right');
      expect(getSuggestedSite('Abdomen - Right')).toBe('Thigh - Left');
      expect(getSuggestedSite('Thigh - Left')).toBe('Thigh - Right');
      expect(getSuggestedSite('Upper Arm - Right')).toBe('Abdomen - Left'); // Wraps around
    });

    it('returns first site for unknown input', () => {
      expect(getSuggestedSite('Unknown')).toBe('Abdomen - Left');
    });
  });

  describe('getInjectionSiteOptions', () => {
    it('returns all sites as options', () => {
      const options = getInjectionSiteOptions();

      expect(options).toHaveLength(6);
      expect(options[0]).toEqual({ value: 'Abdomen - Left', label: 'Abdomen - Left' });
    });
  });
});

describe('Dose Management', () => {
  describe('getDoseOptions', () => {
    it('returns all doses as options with mg suffix', () => {
      const options = getDoseOptions();

      expect(options).toHaveLength(6);
      expect(options[0]).toEqual({ value: 2.5, label: '2.5 mg' });
      expect(options[5]).toEqual({ value: 15, label: '15 mg' });
    });
  });

  describe('getNextTitrationDose', () => {
    it('returns next dose in sequence', () => {
      expect(getNextTitrationDose(2.5)).toBe(5);
      expect(getNextTitrationDose(5)).toBe(7.5);
      expect(getNextTitrationDose(12.5)).toBe(15);
    });

    it('returns null when at max dose', () => {
      expect(getNextTitrationDose(15)).toBeNull();
    });

    it('returns null for invalid dose', () => {
      expect(getNextTitrationDose(6)).toBeNull();
    });
  });

  describe('isDoseIncreaseRecommended', () => {
    it('returns true after 4 weeks on current dose', () => {
      expect(isDoseIncreaseRecommended(2.5, 4)).toBe(true);
      expect(isDoseIncreaseRecommended(7.5, 5)).toBe(true);
    });

    it('returns false before 4 weeks', () => {
      expect(isDoseIncreaseRecommended(2.5, 3)).toBe(false);
    });

    it('returns false at max dose', () => {
      expect(isDoseIncreaseRecommended(15, 10)).toBe(false);
    });
  });

  describe('calculateWeeksOnCurrentDose', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-29')); // 4 weeks after Jan 1
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates weeks on current dose', () => {
      const injections = [
        { doseMg: 2.5, injectionDate: new Date('2025-01-01') },
        { doseMg: 2.5, injectionDate: new Date('2025-01-08') },
        { doseMg: 2.5, injectionDate: new Date('2025-01-15') },
        { doseMg: 2.5, injectionDate: new Date('2025-01-22') },
      ];

      expect(calculateWeeksOnCurrentDose(injections)).toBe(4);
    });

    it('resets count when dose changed', () => {
      vi.setSystemTime(new Date('2025-01-22'));

      const injections = [
        { doseMg: 2.5, injectionDate: new Date('2025-01-01') },
        { doseMg: 2.5, injectionDate: new Date('2025-01-08') },
        { doseMg: 5, injectionDate: new Date('2025-01-15') },
        { doseMg: 5, injectionDate: new Date('2025-01-22') },
      ];

      expect(calculateWeeksOnCurrentDose(injections)).toBe(1);
    });

    it('returns 0 for empty array', () => {
      expect(calculateWeeksOnCurrentDose([])).toBe(0);
    });
  });

  describe('formatDose', () => {
    it('formats number dose', () => {
      expect(formatDose(2.5)).toBe('2.5 mg');
      expect(formatDose(15)).toBe('15.0 mg');
    });

    it('formats string dose', () => {
      expect(formatDose('7.5')).toBe('7.5 mg');
    });
  });
});

describe('Status Display', () => {
  describe('getInjectionStatusColor', () => {
    it('returns correct colors for each status', () => {
      expect(getInjectionStatusColor('upcoming')).toBe('text-success');
      expect(getInjectionStatusColor('reminder')).toBe('text-warning');
      expect(getInjectionStatusColor('due_today')).toBe('text-accent-primary');
      expect(getInjectionStatusColor('overdue')).toBe('text-error');
      expect(getInjectionStatusColor('alert')).toBe('text-error');
    });
  });

  describe('getInjectionStatusMessage', () => {
    it('returns correct messages', () => {
      const dueDate = new Date('2025-01-15');

      expect(getInjectionStatusMessage('due_today', dueDate)).toBe('Injection due today');
      expect(getInjectionStatusMessage('reminder', dueDate)).toBe('Injection due tomorrow');
      expect(getInjectionStatusMessage('overdue', dueDate)).toBe('Injection overdue by 1 day');
    });

    it('shows days overdue for alert status', () => {
      const dueDate = new Date('2025-01-10');
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15'));

      const message = getInjectionStatusMessage('alert', dueDate);
      expect(message).toContain('overdue by');
      expect(message).toContain('days');

      vi.useRealTimers();
    });
  });
});
