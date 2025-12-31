import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  daysBetween,
  weeksBetween,
  addDays,
  addWeeks,
  isSameDay,
  isToday,
  getRelativeTime,
  parseDate,
} from '../dates';

describe('Date Formatting', () => {
  describe('formatDate', () => {
    it('formats date in DD/MM/YYYY by default', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date)).toBe('15/01/2025');
    });

    it('formats date in MM/DD/YYYY', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2025');
    });

    it('formats date in YYYY-MM-DD', () => {
      const date = new Date('2025-01-15');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-01-15');
    });

    it('pads single digit days and months', () => {
      const date = new Date('2025-01-05');
      expect(formatDate(date)).toBe('05/01/2025');
    });
  });

  describe('formatDateTime', () => {
    it('includes time with date', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('15/01/2025');
      expect(result).toContain('14:30');
    });
  });
});

describe('Date Boundaries', () => {
  describe('startOfDay', () => {
    it('returns midnight of the given date', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = startOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
      expect(result.getDate()).toBe(15);
    });
  });

  describe('endOfDay', () => {
    it('returns 23:59:59.999 of the given date', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = endOfDay(date);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('startOfWeek', () => {
    it('returns Monday by default', () => {
      const date = new Date('2025-01-15'); // Wednesday
      const result = startOfWeek(date);

      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(13);
    });

    it('returns Sunday when weekStartsOn is 0', () => {
      const date = new Date('2025-01-15'); // Wednesday
      const result = startOfWeek(date, 0);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(12);
    });
  });

  describe('endOfWeek', () => {
    it('returns Sunday by default (when week starts Monday)', () => {
      const date = new Date('2025-01-15'); // Wednesday
      const result = endOfWeek(date);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(19);
    });
  });

  describe('startOfMonth', () => {
    it('returns first day of month', () => {
      const date = new Date('2025-01-15');
      const result = startOfMonth(date);

      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0); // January
    });
  });

  describe('endOfMonth', () => {
    it('returns last day of month', () => {
      const date = new Date('2025-01-15');
      const result = endOfMonth(date);

      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0); // January
    });

    it('handles February', () => {
      const date = new Date('2025-02-15');
      const result = endOfMonth(date);

      expect(result.getDate()).toBe(28);
    });

    it('handles leap year February', () => {
      const date = new Date('2024-02-15');
      const result = endOfMonth(date);

      expect(result.getDate()).toBe(29);
    });
  });
});

describe('Date Calculations', () => {
  describe('daysBetween', () => {
    it('calculates days between two dates', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-15');

      expect(daysBetween(start, end)).toBe(14);
    });

    it('handles same date', () => {
      const date = new Date('2025-01-01');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('works regardless of order', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-15');

      expect(daysBetween(date1, date2)).toBe(14);
      expect(daysBetween(date2, date1)).toBe(14);
    });
  });

  describe('weeksBetween', () => {
    it('calculates weeks between two dates', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-22');

      expect(weeksBetween(start, end)).toBe(3);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, 7);

      expect(result.getDate()).toBe(22);
    });

    it('subtracts negative days', () => {
      const date = new Date('2025-01-15');
      const result = addDays(date, -7);

      expect(result.getDate()).toBe(8);
    });

    it('handles month boundaries', () => {
      const date = new Date('2025-01-30');
      const result = addDays(date, 5);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('addWeeks', () => {
    it('adds weeks correctly', () => {
      const date = new Date('2025-01-01');
      const result = addWeeks(date, 4);

      expect(result.getDate()).toBe(29);
    });
  });
});

describe('Date Comparisons', () => {
  describe('isSameDay', () => {
    it('returns true for same day', () => {
      const date1 = new Date('2025-01-15T10:00:00');
      const date2 = new Date('2025-01-15T20:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('returns false for different days', () => {
      const date1 = new Date('2025-01-15');
      const date2 = new Date('2025-01-16');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for today', () => {
      expect(isToday(new Date('2025-01-15T08:00:00'))).toBe(true);
    });

    it('returns false for yesterday', () => {
      expect(isToday(new Date('2025-01-14'))).toBe(false);
    });

    it('returns false for tomorrow', () => {
      expect(isToday(new Date('2025-01-16'))).toBe(false);
    });
  });
});

describe('Relative Time', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getRelativeTime', () => {
    it('returns "just now" for very recent times', () => {
      const date = new Date('2025-01-15T12:00:00');
      expect(getRelativeTime(date)).toBe('just now');
    });

    it('returns minutes ago for recent past', () => {
      const date = new Date('2025-01-15T11:30:00');
      expect(getRelativeTime(date)).toBe('30 mins ago');
    });

    it('returns hours ago for same day', () => {
      const date = new Date('2025-01-15T09:00:00');
      expect(getRelativeTime(date)).toBe('3 hours ago');
    });

    it('returns "yesterday" for previous day', () => {
      const date = new Date('2025-01-14T12:00:00');
      expect(getRelativeTime(date)).toBe('yesterday');
    });

    it('returns "tomorrow" for next day', () => {
      const date = new Date('2025-01-16T12:00:00');
      expect(getRelativeTime(date)).toBe('tomorrow');
    });

    it('returns days ago for past dates', () => {
      const date = new Date('2025-01-10T12:00:00');
      expect(getRelativeTime(date)).toBe('5 days ago');
    });

    it('returns "in X days" for future dates', () => {
      const date = new Date('2025-01-20T12:00:00');
      expect(getRelativeTime(date)).toBe('in 5 days');
    });
  });
});

describe('Date Parsing', () => {
  describe('parseDate', () => {
    it('parses ISO format', () => {
      const result = parseDate('2025-01-15');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(15);
    });

    it('parses DD/MM/YYYY format', () => {
      const result = parseDate('15/01/2025');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(15);
    });

    it('returns null for invalid date', () => {
      expect(parseDate('invalid')).toBeNull();
    });
  });
});
