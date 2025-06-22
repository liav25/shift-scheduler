import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, title, icon, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center mb-6">
          {icon && <div className="mr-2">{icon}</div>}
          {title && (
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card; 