import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';

interface NetworkContextType {
  isOnline: boolean;
  simulateOffline: boolean;
  setSimulateOffline: (value: boolean) => void;
  isEffectiveOnline: boolean;
  isBackgroundPaused: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);
  const [isBackgroundPaused, setIsBackgroundPaused] = useState<boolean>(false);

  useEffect(() => {
    // 1. Browser online/offline event listeners for web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    // 2. Mobile AppState listener: pause background updates when app is not active
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const isPaused = nextAppState !== 'active';
      setIsBackgroundPaused(isPaused);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isEffectiveOnline = isOnline && !simulateOffline;

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        simulateOffline,
        setSimulateOffline,
        isEffectiveOnline,
        isBackgroundPaused,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
};
