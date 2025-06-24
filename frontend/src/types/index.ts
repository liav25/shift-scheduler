export interface UnavailabilityWindow {
  start: string;
  end: string;
}

export interface ShiftLengths {
  day_shift_hours: number;
  night_shift_hours: number;
}

export interface NightTimeRange {
  start: string;
  end: string;
}

export interface PostConfig {
  name: string;
  is_24_7: boolean;
  required_hours_start?: string;
  required_hours_end?: string;
}

export interface ScheduleRequest {
  schedule_start_datetime: string;
  schedule_end_datetime: string;
  guards: string[];
  posts: PostConfig[];
  unavailability: Record<string, UnavailabilityWindow[]>;
  shift_lengths: ShiftLengths;
  night_time_range: NightTimeRange;
  max_consecutive_nights?: number;
}

export interface ShiftAssignment {
  guard_id: string;
  post_id: string;
  shift_start_time: string;
  shift_end_time: string;
}

export interface ScheduleMetadata {
  total_assignments: number;
  unique_guards: number;
  unique_posts: number;
  schedule_duration_hours: number;
  generated_at: string;
}

export interface ScheduleResponse {
  success: boolean;
  assignments?: ShiftAssignment[];
  error?: string;
  metadata?: ScheduleMetadata;
}

export interface TimeValidationResponse {
  valid: boolean;
  closest_time?: string;
  message?: string;
}

export interface FormData {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  guards: string[];
  posts: PostConfig[];
  dayShiftHours: number;
  nightShiftHours: number;
  nightStartTime: string;
  nightEndTime: string;
  maxConsecutiveNights: number;
}

export interface TimeValidationPopup {
  show: boolean;
  message: string;
  suggestedTime: string;
  field: string;
  onAccept: () => void;
  onCancel: () => void;
}

export interface AlgorithmInfo {
  algorithm: string;
  description: string;
  features: string[];
  constraints: string[];
} 