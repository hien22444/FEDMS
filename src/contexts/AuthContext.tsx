import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import type { IUser } from '@/interfaces';
import { getProfile, logout as logoutAction, refreshAccessToken } from '@/lib/actions';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_THROTTLE_MS = 60 * 1000; // Only update lastActivity every 60 seconds

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
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Check inactivity BEFORE making any API calls
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          console.warn('Session expired on init: inactive for more than 30 minutes');
          logoutAction();
          localStorage.removeItem('lastActivity');
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            profile: null,
          });
          return;
        }
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
        // Token invalid or expired — try refreshing
        console.error('Auth init failed, attempting token refresh:', error);
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            const data = await getProfile();
            setState({
              isAuthenticated: true,
              isLoading: false,
              user: data.user,
              profile: data.profile,
            });
            return;
          } catch {
            // Refresh succeeded but profile fetch still failed
          }
        }

        // All attempts failed — clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
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
      localStorage.setItem('lastActivity', Date.now().toString());
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
    localStorage.removeItem('lastActivity');
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      profile: null,
    });
    navigate(ROUTES.LANDING);
  }, [navigate]);

  // ─── Inactivity timeout logic (throttled) ───
  const lastActivityWrite = useRef<number>(0);

  const resetInactivityTimer = useCallback(() => {
    if (!state.isAuthenticated) return;

    // Throttle localStorage writes — only update every ACTIVITY_THROTTLE_MS
    const now = Date.now();
    if (now - lastActivityWrite.current > ACTIVITY_THROTTLE_MS) {
      localStorage.setItem('lastActivity', now.toString());
      lastActivityWrite.current = now;
    }

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      console.warn('Session expired due to 30 minutes of inactivity');
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [state.isAuthenticated, logout]);

  // Set up activity listeners when authenticated
  useEffect(() => {
    if (!state.isAuthenticated) {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleActivity));

    // Start the timer
    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [state.isAuthenticated, resetInactivityTimer]);

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
