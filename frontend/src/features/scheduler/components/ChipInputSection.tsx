import React, { useState } from 'react';
import { Input, Chip } from '../../../ui';
import { sanitizeName } from '../../../utils/validationUtils';

interface ChipInputSectionProps {
  title: string;
  emoji: string;
  items: string[];
  placeholder: string;
  variant: 'blue' | 'green';
  disabled?: boolean;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  minItems?: number;
}

const ChipInputSection: React.FC<ChipInputSectionProps> = ({
  title,
  emoji,
  items,
  placeholder,
  variant,
  disabled = false,
  onAdd,
  onRemove,
  minItems = 1,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sanitizedValue = sanitizeName(inputValue);
      if (sanitizedValue && !items.includes(sanitizedValue)) {
        onAdd(sanitizedValue);
        setInputValue('');
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
        {emoji} {title}
      </h3>
      
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        helper="Press Enter to add"
        disabled={disabled}
      />

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Chip
            key={index}
            variant={variant}
            onRemove={items.length > minItems && !disabled ? () => onRemove(index) : undefined}
            disabled={disabled}
          >
            {item}
          </Chip>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} added yet</p>
      )}
    </div>
  );
};

export default ChipInputSection; 