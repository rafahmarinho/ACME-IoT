import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types/iot';
import { INITIAL_USER_PROFILES } from '../services/demoData';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, fullName: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  canControlDevices: boolean;
  canManageAutomations: boolean;
  canManageTeam: boolean;
  canDeployFirmware: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = '@acme_iot_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(INITIAL_USER_PROFILES[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(INITIAL_USER_PROFILES[0]); // Default to Owner
      }
    } catch {
      setUser(INITIAL_USER_PROFILES[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, _pass: string) => {
    // Check against demo profiles or create matching user
    const found = INITIAL_USER_PROFILES.find((u) => u.email.toLowerCase() === email.toLowerCase());
    const targetUser: UserProfile = found || {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role: 'operator',
      organizationId: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date().toISOString(),
    };

    setUser(targetUser);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(targetUser));
    return { success: true };
  };

  const register = async (email: string, _pass: string, fullName: string, role: UserRole = 'operator') => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      role,
      organizationId: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const recoverPassword = async (email: string) => {
    return {
      success: true,
      message: `Password reset instructions sent to ${email}. Check your inbox.`,
    };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return;
    const updated: UserProfile = { ...user, role: newRole };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  };

  const role = user?.role || 'viewer';
  const canControlDevices = role === 'owner' || role === 'admin' || role === 'operator';
  const canManageAutomations = role === 'owner' || role === 'admin';
  const canManageTeam = role === 'owner';
  const canDeployFirmware = role === 'owner' || role === 'admin';
  const isViewer = role === 'viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        register,
        recoverPassword,
        logout,
        switchRole,
        canControlDevices,
        canManageAutomations,
        canManageTeam,
        canDeployFirmware,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
