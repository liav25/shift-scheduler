import { format, parseISO } from 'date-fns';

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get date that is N days from today in YYYY-MM-DD format
 */
export const getDateFromToday = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

/**
 * Format date with day name for display
 */
export const formatDateWithDay = (dateString: string): string => {
  return format(parseISO(dateString), 'EEE, MMM dd, yyyy');
};

/**
 * Check if a shift is a night shift based on start hour
 */
export const isNightShift = (startTime: string): boolean => {
  const hour = parseISO(startTime).getHours();
  return hour >= 22 || hour < 6; // 10 PM to 6 AM
};

/**
 * Format time range for display
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${format(parseISO(startTime), 'HH:mm')} - ${format(parseISO(endTime), 'HH:mm')}`;
}; 