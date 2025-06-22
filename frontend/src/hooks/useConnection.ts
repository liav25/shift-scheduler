import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { testConnection } from '../services/api';

export const useConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const checkConnection = async () => {
    try {
      const connected = await testConnection();
      setIsConnected(connected);
      
      if (!connected) {
        toast.error('Backend server is not running. Please start the backend server.');
      } else {
        toast.success('Connected to backend server!');
      }
      
      return connected;
    } catch (error) {
      setIsConnected(false);
      toast.error('Failed to test connection to backend server.');
      return false;
    }
  };

  // Test connection on hook initialization
  useEffect(() => {
    checkConnection();
  }, []);

  return {
    isConnected,
    checkConnection,
  };
}; 