// Time-related constants
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export const SHIFT_HOUR_OPTIONS = Array.from({ length: 48 }, (_, i) => (i + 1) * 0.5);

// Default form values
export const DEFAULT_FORM_VALUES = {
  dayShiftHours: 3,
  nightShiftHours: 2.5,
  nightStartTime: '01:00',
  nightEndTime: '06:00',
  maxConsecutiveNights: 1,
  defaultGuards: ['Guard 1'],
  defaultPosts: ['Main Gate'],
};

// UI Constants
export const COLORS = {
  primary: 'blue',
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'indigo',
} as const;

// API Configuration
export const API_CONFIG = {
  baseURL: 'http://localhost:8000',
  timeout: 30000,
} as const;

// Schedule constraints
export const SCHEDULE_CONSTRAINTS = {
  maxGuards: 50,
  maxPosts: 20,
  maxDurationDays: 365,
  minShiftHours: 0.5,
  maxShiftHours: 24,
} as const; 