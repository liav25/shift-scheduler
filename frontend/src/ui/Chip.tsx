import React from 'react';
import { X } from 'lucide-react';

interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const Chip: React.FC<ChipProps> = ({
  children,
  onRemove,
  variant = 'blue',
  size = 'md',
  disabled = false,
}) => {
  const variantClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const removeButtonClasses = {
    blue: 'text-blue-600 hover:text-blue-800 hover:bg-blue-200',
    green: 'text-green-600 hover:text-green-800 hover:bg-green-200',
    red: 'text-red-600 hover:text-red-800 hover:bg-red-200',
    yellow: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-200',
    gray: 'text-gray-600 hover:text-gray-800 hover:bg-gray-200',
  };

  return (
    <div className={`inline-flex items-center rounded-full font-medium border ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''}`}>
      <span>{children}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          className={`ml-2 p-0.5 rounded-full transition-colors ${removeButtonClasses[variant]}`}
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default Chip; 