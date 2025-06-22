import React from 'react';
import { Input, Select } from '../../../ui';
import { TIME_OPTIONS } from '../../../constants';

interface SchedulePeriodSectionProps {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  disabled?: boolean;
  onDateChange: (field: 'startDate' | 'endDate', value: string) => void;
  onTimeChange: (field: 'startTime' | 'endTime', value: string) => void;
}

const SchedulePeriodSection: React.FC<SchedulePeriodSectionProps> = ({
  startDate,
  startTime,
  endDate,
  endTime,
  disabled = false,
  onDateChange,
  onTimeChange,
}) => {
  const timeOptions = TIME_OPTIONS.map(time => ({ value: time, label: time }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
        📅 Schedule Period
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start Date"
          value={startDate}
          onChange={(e) => onDateChange('startDate', e.target.value)}
          required
          disabled={disabled}
        />
        
        <Select
          label="Start Time"
          value={startTime}
          onChange={(e) => onTimeChange('startTime', e.target.value)}
          options={timeOptions}
          required
          disabled={disabled}
        />
        
        <Input
          type="date"
          label="End Date"
          value={endDate}
          onChange={(e) => onDateChange('endDate', e.target.value)}
          required
          disabled={disabled}
        />
        
        <Select
          label="End Time"
          value={endTime}
          onChange={(e) => onTimeChange('endTime', e.target.value)}
          options={timeOptions}
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default SchedulePeriodSection; 