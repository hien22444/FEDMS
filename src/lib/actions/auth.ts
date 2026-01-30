import { api } from '../apiRequest';
import type { IUser } from '@/interfaces';

// Response types from backend
interface LoginResponse {
  token: string;
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

export const signIn = async (doc: IUser.SignInDto) => {
  const res = await api.post<LoginResponse>('auth/login', doc);

  // Store token in localStorage
  if (res.token) {
    localStorage.setItem('token', res.token);
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
};

export const getProfile = async () => {
  const res = await api.get<LoginResponse>('auth/profile');
  return res;
};
