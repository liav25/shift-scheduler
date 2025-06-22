import { useState } from 'react';
import toast from 'react-hot-toast';
import { ScheduleRequest, ScheduleResponse } from '../types';
import { generateSchedule } from '../services/api';

export const useScheduleGeneration = () => {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSchedule = async (request: ScheduleRequest) => {
    setIsLoading(true);
    
    try {
      toast.loading('Generating schedule...', { id: 'schedule-generation' });
      
      const response = await generateSchedule(request);
      setSchedule(response);
      
      if (response.success) {
        toast.success(
          `Schedule generated successfully! ${response.assignments?.length || 0} shifts created.`,
          { id: 'schedule-generation' }
        );
      } else {
        toast.error(response.error || 'Failed to generate schedule', { id: 'schedule-generation' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error: ${errorMessage}`, { id: 'schedule-generation' });
      
      setSchedule({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSchedule = () => {
    setSchedule(null);
  };

  return {
    schedule,
    isLoading,
    handleGenerateSchedule,
    clearSchedule,
  };
}; 