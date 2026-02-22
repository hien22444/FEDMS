import { api } from '../apiRequest';
import type { IUser } from '@/interfaces';

// Response types from backend
interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login: string;
  };
  profile: IUser.StudentProfile | null;
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
  };
}

interface RefreshTokenResponse {
  token: string;
}

export const signIn = async (doc: IUser.SignInDto) => {
  const res = await api.post<LoginResponse>('auth/login', doc);

  // Store tokens in localStorage
  if (res.token) {
    localStorage.setItem('token', res.token);
  }
  if (res.refreshToken) {
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  return res;
};

export const signUp = async (doc: IUser.SignupDto) => {
  const res = await api.post<RegisterResponse>('auth/register', doc);

  // Store token in localStorage
  if (res.token) {
    localStorage.setItem('token', res.token);
  }

  return res;
};

export const logout = async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

export const getProfile = async () => {
  const res = await api.get<LoginResponse>('auth/profile');
  return res;
};

export const refreshAccessToken = async (): Promise<RefreshTokenResponse | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await api.post<RefreshTokenResponse>('auth/refresh-token', { refreshToken });
    if (res.token) {
      localStorage.setItem('token', res.token);
    }
    // Refresh token is NOT rotated — keep the original
    return res;
  } catch {
    // Refresh token also expired — force logout
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
      return null;
  }
};
