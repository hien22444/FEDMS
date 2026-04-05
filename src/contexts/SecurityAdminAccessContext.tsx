/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { IUser } from '@/interfaces';
import { loginPreview } from '@/lib/actions/auth';

const STORAGE_KEY = 'security_admin_access';
const ACCESS_TTL_MS = 30 * 60 * 1000;

type StoredAccess = {
  token: string;
  user: IUser.Response;
  expiresAt: number;
};

interface SecurityAdminAccessContextType {
  isAdminAccessGranted: boolean;
  adminAccessToken: string | null;
  adminAccessUser: IUser.Response | null;
  grantAdminAccess: (credentials: { username: string; password: string }) => Promise<void>;
  revokeAdminAccess: () => void;
}

const SecurityAdminAccessContext = createContext<SecurityAdminAccessContextType | null>(null);

export function SecurityAdminAccessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredAccess | null>(null);
  const revokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revokeAdminAccess = useCallback(() => {
    if (revokeTimer.current) {
      clearTimeout(revokeTimer.current);
      revokeTimer.current = null;
    }
    sessionStorage.removeItem(STORAGE_KEY);
    setState(null);
  }, []);

  const grantAdminAccess = useCallback(
    async ({ username, password }: { username: string; password: string }) => {
      const res = await loginPreview({ email: username, password });

      if (res.user.role !== 'admin') {
        throw new Error('This account is not an admin');
      }

      const nextState: StoredAccess = {
        token: res.token,
        user: res.user,
        expiresAt: Date.now() + ACCESS_TTL_MS,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      setState(nextState);
    },
    []
  );

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as StoredAccess;
      if (parsed?.token && parsed?.user && parsed.expiresAt > Date.now()) {
        setState(parsed);
        return;
      }
    } catch {
      // Ignore invalid stored state.
    }

    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!state?.expiresAt) return;

    const remaining = state.expiresAt - Date.now();
    if (remaining <= 0) {
      revokeAdminAccess();
      return;
    }

    revokeTimer.current = setTimeout(() => {
      revokeAdminAccess();
    }, remaining);

    return () => {
      if (revokeTimer.current) {
        clearTimeout(revokeTimer.current);
        revokeTimer.current = null;
      }
    };
  }, [state?.expiresAt, revokeAdminAccess]);

  const value = useMemo<SecurityAdminAccessContextType>(
    () => ({
      isAdminAccessGranted: Boolean(state?.token),
      adminAccessToken: state?.token || null,
      adminAccessUser: state?.user || null,
      grantAdminAccess,
      revokeAdminAccess,
    }),
    [grantAdminAccess, revokeAdminAccess, state]
  );

  return (
    <SecurityAdminAccessContext.Provider value={value}>
      {children}
    </SecurityAdminAccessContext.Provider>
  );
}

export function useSecurityAdminAccess() {
  const context = useContext(SecurityAdminAccessContext);
  if (!context) {
    throw new Error('useSecurityAdminAccess must be used within a SecurityAdminAccessProvider');
  }
  return context;
}
