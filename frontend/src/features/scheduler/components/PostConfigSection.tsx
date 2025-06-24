import React, { useState } from 'react';
import { Input, Button, Select } from '../../../ui';
import { PostConfig } from '../../../types';
import { sanitizeName } from '../../../utils/validationUtils';
import { TIME_OPTIONS } from '../../../constants';
import { X, Clock, CheckCircle2 } from 'lucide-react';

interface PostConfigSectionProps {
  posts: PostConfig[];
  disabled?: boolean;
  onAdd: (post: PostConfig) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, post: PostConfig) => void;
}

const PostConfigSection: React.FC<PostConfigSectionProps> = ({
  posts,
  disabled = false,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const [newPostName, setNewPostName] = useState('');
  const [is24_7, setIs24_7] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const timeOptions = TIME_OPTIONS.map(time => ({ value: time, label: time }));

  const handleAddPost = () => {
    const sanitizedName = sanitizeName(newPostName);
    if (!sanitizedName) return;

    // Check if post name already exists
    if (posts.some(post => post.name === sanitizedName)) return;

    const newPost: PostConfig = {
      name: sanitizedName,
      is_24_7: is24_7,
      required_hours_start: is24_7 ? undefined : startTime,
      required_hours_end: is24_7 ? undefined : endTime,
    };

    onAdd(newPost);
    setNewPostName('');
    setIs24_7(true);
    setStartTime('08:00');
    setEndTime('17:00');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPost();
    }
  };

  const togglePost24_7 = (index: number) => {
    const post = posts[index];
    const updatedPost: PostConfig = {
      ...post,
      is_24_7: !post.is_24_7,
      required_hours_start: !post.is_24_7 ? undefined : '08:00',
      required_hours_end: !post.is_24_7 ? undefined : '17:00',
    };
    onUpdate(index, updatedPost);
  };

  const updatePostTime = (index: number, field: 'required_hours_start' | 'required_hours_end', value: string) => {
    const post = posts[index];
    const updatedPost: PostConfig = {
      ...post,
      [field]: value,
    };
    onUpdate(index, updatedPost);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
        🏢 עמדות שמירה
      </h3>
      
      {/* Add new post form */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            value={newPostName}
            onChange={(e) => setNewPostName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="הקלד שם עמדה"
            disabled={disabled}
            label="שם עמדה"
          />
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={is24_7}
                onChange={(e) => setIs24_7(e.target.checked)}
                disabled={disabled}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">שמירה 24/7</span>
            </label>
          </div>
        </div>

        {!is24_7 && (
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="שעת התחלה"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              options={timeOptions}
              disabled={disabled}
            />
            <Select
              label="שעת סיום"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              options={timeOptions}
              disabled={disabled}
            />
          </div>
        )}

        <Button
          onClick={handleAddPost}
          disabled={disabled || !newPostName.trim()}
          variant="secondary"
          size="sm"
        >
          הוסף עמדה
        </Button>
      </div>

      {/* Existing posts list */}
      <div className="space-y-3">
        {posts.map((post, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{post.name}</h4>
              <Button
                onClick={() => onRemove(index)}
                variant="ghost"
                size="sm"
                icon={X}
                disabled={disabled || posts.length <= 1}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              />
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={post.is_24_7}
                  onChange={() => togglePost24_7(index)}
                  disabled={disabled}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 flex items-center">
                  {post.is_24_7 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 mr-1" />
                      שמירה 24/7
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-blue-600 mr-1" />
                      שעות מוגדרות
                    </>
                  )}
                </span>
              </label>
            </div>

            {!post.is_24_7 && (
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="שעת התחלה"
                  value={post.required_hours_start || '08:00'}
                  onChange={(e) => updatePostTime(index, 'required_hours_start', e.target.value)}
                  options={timeOptions}
                  disabled={disabled}
                />
                <Select
                  label="שעת סיום"
                  value={post.required_hours_end || '17:00'}
                  onChange={(e) => updatePostTime(index, 'required_hours_end', e.target.value)}
                  options={timeOptions}
                  disabled={disabled}
                />
              </div>
            )}

            {!post.is_24_7 && (
              <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                עמדה זו תידרש רק בין השעות {post.required_hours_start} - {post.required_hours_end}
              </div>
            )}
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-sm text-gray-500 italic text-center py-4">
          טרם נוספו עמדות שמירה
        </p>
      )}
    </div>
  );
};

export default PostConfigSection; 