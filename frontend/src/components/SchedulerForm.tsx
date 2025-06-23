import React, { useState } from 'react';
import { Play, AlertTriangle } from 'lucide-react';
import { ScheduleRequest, UnavailabilityWindow, FormData, TimeValidationPopup } from '../types';
import { validateTime } from '../services/api';
import { validateFormData } from '../utils/validationUtils';
import { getTodayDateString, getDateFromToday } from '../utils/dateUtils';
import { DEFAULT_FORM_VALUES, TIME_OPTIONS, SHIFT_HOUR_OPTIONS } from '../constants';
import { Button, Select } from '../ui';
import SchedulePeriodSection from '../features/scheduler/components/SchedulePeriodSection';
import ChipInputSection from '../features/scheduler/components/ChipInputSection';

interface SchedulerFormProps {
  onSubmit: (request: ScheduleRequest) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const SchedulerForm: React.FC<SchedulerFormProps> = ({ onSubmit, isLoading, disabled = false }) => {
  const [formData, setFormData] = useState<FormData>({
    startDate: getTodayDateString(),
    startTime: '00:00',
    endDate: getDateFromToday(3),
    endTime: '00:00',
    guards: DEFAULT_FORM_VALUES.defaultGuards,
    posts: DEFAULT_FORM_VALUES.defaultPosts,
    dayShiftHours: DEFAULT_FORM_VALUES.dayShiftHours,
    nightShiftHours: DEFAULT_FORM_VALUES.nightShiftHours,
    nightStartTime: DEFAULT_FORM_VALUES.nightStartTime,
    nightEndTime: DEFAULT_FORM_VALUES.nightEndTime,
    maxConsecutiveNights: DEFAULT_FORM_VALUES.maxConsecutiveNights,
  });

  const [unavailability, setUnavailability] = useState<Record<string, UnavailabilityWindow[]>>({});
  const [timePopup, setTimePopup] = useState<TimeValidationPopup | null>(null);

  const timeOptions = TIME_OPTIONS.map(time => ({ value: time, label: time }));
  const shiftHourOptions = SHIFT_HOUR_OPTIONS.map(hours => ({
    value: hours,
    label: `${hours % 1 === 0 ? `${hours}.0` : hours} שעות`
  }));

  const validateTimeInput = async (time: string, field: string) => {
    if (!time) return true;
    
    try {
      const validation = await validateTime(time);
      if (!validation.valid && validation.closest_time) {
        setTimePopup({
          show: true,
          message: validation.message || 'Invalid time format',
          suggestedTime: validation.closest_time,
          field,
          onAccept: () => {
            setFormData(prev => ({ ...prev, [field]: validation.closest_time! }));
            setTimePopup(null);
          },
          onCancel: () => setTimePopup(null),
        });
        return false;
      }
      return true;
    } catch (error) {
      return true; // Allow if validation fails
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime' | 'nightStartTime' | 'nightEndTime', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value && value.includes(':')) {
      validateTimeInput(value, field);
    }
  };

  const addGuard = (guardName: string) => {
    setFormData(prev => ({ ...prev, guards: [...prev.guards, guardName] }));
  };

  const removeGuard = (index: number) => {
    const guardName = formData.guards[index];
    setFormData(prev => ({
      ...prev,
      guards: prev.guards.filter((_, i) => i !== index),
    }));
    
    // Remove unavailability for this guard
    if (guardName) {
      setUnavailability(prev => {
        const newUnavailability = { ...prev };
        delete newUnavailability[guardName];
        return newUnavailability;
      });
    }
  };

  const addPost = (postName: string) => {
    setFormData(prev => ({ ...prev, posts: [...prev.posts, postName] }));
  };

  const removePost = (index: number) => {
    setFormData(prev => ({
      ...prev,
      posts: prev.posts.filter((_, i) => i !== index),
    }));
  };

  const addUnavailability = (guardName: string) => {
    setUnavailability(prev => ({
      ...prev,
      [guardName]: [
        ...(prev[guardName] || []),
        { start: '', end: '' },
      ],
    }));
  };

  const removeUnavailability = (guardName: string, index: number) => {
    setUnavailability(prev => ({
      ...prev,
      [guardName]: prev[guardName]?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateUnavailability = (guardName: string, index: number, field: 'start' | 'end', value: string) => {
    setUnavailability(prev => ({
      ...prev,
      [guardName]: prev[guardName]?.map((window, i) =>
        i === index ? { ...window, [field]: value } : window
      ) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    const request: ScheduleRequest = {
      schedule_start_datetime: `${formData.startDate}T${formData.startTime}:00`,
      schedule_end_datetime: `${formData.endDate}T${formData.endTime}:00`,
      guards: formData.guards.filter(guard => guard.trim()),
      posts: formData.posts.filter(post => post.trim()),
      unavailability,
      shift_lengths: {
        day_shift_hours: formData.dayShiftHours,
        night_shift_hours: formData.nightShiftHours,
      },
      night_time_range: {
        start: formData.nightStartTime,
        end: formData.nightEndTime,
      },
      max_consecutive_nights: formData.maxConsecutiveNights,
    };

    onSubmit(request);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Schedule Period */}
        <SchedulePeriodSection
          startDate={formData.startDate}
          startTime={formData.startTime}
          endDate={formData.endDate}
          endTime={formData.endTime}
          disabled={disabled}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
        />

        {/* Guards Management */}
        <ChipInputSection
          title="חיילים"
          emoji="👥"
          items={formData.guards}
          placeholder="הקלד שם חייל ולחץ Enter"
          variant="blue"
          disabled={disabled}
          onAdd={addGuard}
          onRemove={removeGuard}
        />

        {/* Posts Management */}
        <ChipInputSection
          title="עמדות שמירה"
          emoji="🏢"
          items={formData.posts}
          placeholder="הקלד שם עמדה ולחץ Enter"
          variant="green"
          disabled={disabled}
          onAdd={addPost}
          onRemove={removePost}
        />

        {/* Guard Unavailability */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            🚫 אי-זמינות חיילים
          </h3>
          <p className="text-sm text-gray-600">
            קבע תקופות בהן חיילים לא יכולים לעבוד (אופציונלי)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.guards.filter(guard => guard.trim()).map((guard) => (
              <div key={guard} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 text-sm">{guard}</h4>
                  <Button
                    type="button"
                    onClick={() => addUnavailability(guard)}
                    variant="secondary"
                    size="sm"
                    disabled={disabled}
                  >
                    + הוסף תקופה
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {unavailability[guard]?.map((window, index) => (
                    <div key={index} className="space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">מ:</label>
                          <input
                            type="datetime-local"
                            value={window.start}
                            onChange={(e) => updateUnavailability(guard, index, 'start', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            disabled={disabled}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">עד:</label>
                          <input
                            type="datetime-local"
                            value={window.end}
                            onChange={(e) => updateUnavailability(guard, index, 'end', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            disabled={disabled}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={() => removeUnavailability(guard, index)}
                          variant="danger"
                          size="sm"
                          disabled={disabled}
                          className="p-1"
                        >
                          × הסר תקופה
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(!unavailability[guard] || unavailability[guard].length === 0) && (
                    <p className="text-xs text-gray-500 italic">אין תקופות אי-זמינות</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            ⚙️ הגדרות משמרות
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="שעות משמרת יום"
              value={formData.dayShiftHours}
              onChange={(e) => setFormData(prev => ({ ...prev, dayShiftHours: Number(e.target.value) }))}
              options={shiftHourOptions}
              required
              disabled={disabled}
            />
            
            <Select
              label="שעות משמרת לילה"
              value={formData.nightShiftHours}
              onChange={(e) => setFormData(prev => ({ ...prev, nightShiftHours: Number(e.target.value) }))}
              options={shiftHourOptions}
              required
              disabled={disabled}
            />
            
            <Select
              label="תחילת משמרת לילה"
              value={formData.nightStartTime}
              onChange={(e) => handleTimeChange('nightStartTime', e.target.value)}
              options={timeOptions}
              required
              disabled={disabled}
            />
            
            <Select
              label="סיום משמרת לילה"
              value={formData.nightEndTime}
              onChange={(e) => handleTimeChange('nightEndTime', e.target.value)}
              options={timeOptions}
              required
              disabled={disabled}
            />

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מקס' לילות רצופים
              </label>
              <input
                type="number"
                value={formData.maxConsecutiveNights}
                onChange={(e) => setFormData(prev => ({ ...prev, maxConsecutiveNights: Number(e.target.value) }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            type="submit"
            loading={isLoading}
            disabled={disabled}
            icon={Play}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'יוצר רשימת שמירה...' : 'צור רשימת שמירה'}
          </Button>
          
          {disabled && (
            <p className="text-sm text-red-600 text-center mt-2">
              השרת האחורי לא מחובר. אנא וודא שהשרת פועל.
            </p>
          )}
        </div>
      </form>

      {/* Time Validation Popup */}
      {timePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 ml-2" />
              <h3 className="text-lg font-semibold text-gray-900">פורמט זמן לא תקין</h3>
            </div>
            <p className="text-gray-600 mb-4">{timePopup.message}</p>
            <p className="text-gray-600 mb-6">
              זמן מוצע: <strong className="text-blue-600">{timePopup.suggestedTime}</strong>
            </p>
            <div className="flex space-x-3">
              <Button onClick={timePopup.onAccept} variant="primary" className="flex-1">
                השתמש בזמן המוצע
              </Button>
              <Button onClick={timePopup.onCancel} variant="secondary" className="flex-1">
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchedulerForm; 