/**
 * Date formatting and calculation utilities
 */

export type DateFormatStyle = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

/**
 * Format a date according to the specified format
 */
export function formatDate(date: Date, format: DateFormatStyle = 'DD/MM/YYYY'): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date, format: DateFormatStyle = 'DD/MM/YYYY'): string {
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${formatDate(date, format)} ${time}`;
}

/**
 * Get the start of a day (midnight)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of a day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of a week (Monday by default)
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? (weekStartsOn === 0 ? 0 : -6) : weekStartsOn - day;
  result.setDate(result.getDate() + diff);
  return startOfDay(result);
}

/**
 * Get the end of a week (Sunday by default)
 */
export function endOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const start = startOfWeek(date, weekStartsOn);
  const result = new Date(start);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
}

/**
 * Get the start of a month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}

/**
 * Get the end of a month
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
}

/**
 * Get days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get weeks between two dates
 */
export function weeksBetween(start: Date, end: Date): number {
  const days = daysBetween(start, end);
  return Math.ceil(days / 7);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffMins) < 1) return 'just now';
  if (Math.abs(diffMins) < 60) {
    return diffMins > 0 ? `in ${diffMins} mins` : `${Math.abs(diffMins)} mins ago`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
  }
  if (Math.abs(diffDays) === 1) {
    return diffDays > 0 ? 'tomorrow' : 'yesterday';
  }
  return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
}

/**
 * Parse a date string in various formats
 */
export function parseDate(dateStr: string): Date | null {
  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
  }

  // Try MM/DD/YYYY
  const mmddyyyy = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mmddyyyy) {
    return new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
  }

  return null;
}
