import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from '../constants';
import { ScheduleRequest, ScheduleResponse, TimeValidationResponse, AlgorithmInfo } from '../types';

// Create axios instance with configuration
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Test connection to the backend server
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const response: AxiosResponse<{ status: string }> = await api.get('/health');
    return response.data.status === 'healthy';
  } catch (error) {
    console.warn('Backend connection test failed:', error);
    return false;
  }
};

/**
 * Generate a schedule based on the provided request
 */
export const generateSchedule = async (request: ScheduleRequest): Promise<ScheduleResponse> => {
  try {
    const response: AxiosResponse<ScheduleResponse> = await api.post('/schedule', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error(`Network error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while generating schedule');
  }
};

/**
 * Validate time format and get suggestions
 */
export const validateTime = async (timeStr: string): Promise<TimeValidationResponse> => {
  try {
    const response: AxiosResponse<TimeValidationResponse> = await api.get(`/validate-time/${timeStr}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        return error.response.data;
      }
    }
    // Return a fallback response for validation errors
    return {
      valid: false,
      message: 'Error validating time format'
    };
  }
};

export const getAlgorithmInfo = async (): Promise<AlgorithmInfo> => {
  try {
    const response: AxiosResponse<AlgorithmInfo> = await api.get('/algorithm-info');
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch algorithm information');
  }
};

export const checkHealth = async (): Promise<{ status: string; timestamp: string; version: string }> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend health check failed');
  }
}; 