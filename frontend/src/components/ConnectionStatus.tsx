import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  if (isConnected === null) {
    return (
      <div className="flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg">
        <Loader className="h-4 w-4 ml-2 animate-spin" />
        בודק חיבור...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center px-3 py-1 text-sm text-green-600 bg-green-100 rounded-lg">
        <Wifi className="h-4 w-4 ml-2" />
        השרת מחובר
      </div>
    );
  }

  return (
    <div className="flex items-center px-3 py-1 text-sm text-red-600 bg-red-100 rounded-lg">
      <WifiOff className="h-4 w-4 ml-2" />
      השרת מנותק
    </div>
  );
};

export default ConnectionStatus; 