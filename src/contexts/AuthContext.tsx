import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import type { IUser } from '@/interfaces';
import { getProfile, logout as logoutAction } from '@/lib/actions';

// Auth state interface
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUser.Response | null;
  profile: IUser.StudentProfile | null;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (token: string, user: IUser.Response, profile?: IUser.StudentProfile | null) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  profile: null,
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Check token and load user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          profile: null,
        });
        return;
      }

      try {
        // Validate token by fetching profile
        const data = await getProfile();
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
          profile: data.profile,
        });
      } catch (error) {
        // Token invalid or expired
        console.error('Auth init failed:', error);
        localStorage.removeItem('token');
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          profile: null,
        });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(
    (token: string, user: IUser.Response, profile?: IUser.StudentProfile | null) => {
      localStorage.setItem('token', token);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user,
        profile: profile || null,
      });
    },
    []
  );

  // Logout function
  const logout = useCallback(() => {
    logoutAction();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      profile: null,
    });
    navigate(ROUTES.LANDING);
  }, [navigate]);

  // Refresh profile function
  const refreshProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setState(prev => ({
        ...prev,
        user: data.user,
        profile: data.profile,
      }));
    } catch (error) {
      console.error('Refresh profile failed:', error);
      logout();
    }
  }, [logout]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
