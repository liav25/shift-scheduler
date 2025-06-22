import { FormData } from '../types';
import { SCHEDULE_CONSTRAINTS } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate form data before submission
 */
export const validateFormData = (formData: FormData): ValidationResult => {
  const errors: string[] = [];

  // Date validation
  if (!formData.startDate) {
    errors.push('Start date is required');
  }
  if (!formData.endDate) {
    errors.push('End date is required');
  }
  if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
    errors.push('End date must be after start date');
  }

  // Guards validation
  if (formData.guards.length === 0) {
    errors.push('At least one guard is required');
  }
  if (formData.guards.length > SCHEDULE_CONSTRAINTS.maxGuards) {
    errors.push(`Maximum ${SCHEDULE_CONSTRAINTS.maxGuards} guards allowed`);
  }

  // Posts validation
  if (formData.posts.length === 0) {
    errors.push('At least one post is required');
  }
  if (formData.posts.length > SCHEDULE_CONSTRAINTS.maxPosts) {
    errors.push(`Maximum ${SCHEDULE_CONSTRAINTS.maxPosts} posts allowed`);
  }

  // Shift hours validation
  if (formData.dayShiftHours < SCHEDULE_CONSTRAINTS.minShiftHours || 
      formData.dayShiftHours > SCHEDULE_CONSTRAINTS.maxShiftHours) {
    errors.push(`Day shift hours must be between ${SCHEDULE_CONSTRAINTS.minShiftHours} and ${SCHEDULE_CONSTRAINTS.maxShiftHours}`);
  }
  if (formData.nightShiftHours < SCHEDULE_CONSTRAINTS.minShiftHours || 
      formData.nightShiftHours > SCHEDULE_CONSTRAINTS.maxShiftHours) {
    errors.push(`Night shift hours must be between ${SCHEDULE_CONSTRAINTS.minShiftHours} and ${SCHEDULE_CONSTRAINTS.maxShiftHours}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if a string is a valid time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Sanitize and validate guard/post names
 */
export const sanitizeName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
}; 