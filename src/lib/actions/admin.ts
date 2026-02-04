import { api } from '../apiRequest';

// Reuse BE structure (BEDMS auth.service login response)
export interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login: string | null;
  };
  profile: unknown | null;
}

export interface AdminLoginDto {
  email: string;
  password: string;
}

// Login admin (supports special admin/admin account in BEDMS)
export const adminLogin = async (payload: AdminLoginDto) => {
  const res = await api.post<AdminLoginResponse>('v1/auth/login', payload);

  if (res.token) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('admin-role', res.user.role || '');
  }

  return res;
};

// ===== Dorm types & APIs =====

export interface Dorm {
  id: string;
  dorm_name: string;
  dorm_code: string;
  total_blocks: number;
  description?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DormListResponse {
  items: Dorm[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchDorms = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const url = `v1/dorms${query ? `?${query}` : ''}`;

  return api.get<DormListResponse>(url);
};

export const createDorm = async (body: Partial<Dorm>) => {
  return api.post<Dorm>('v1/dorms', body);
};

export const updateDorm = async (id: string, body: Partial<Dorm>) => {
  return api.patch<Dorm>(`v1/dorms/${id}`, body);
};

export const deleteDorm = async (id: string) => {
  return api.delete<{ message: string }>(`v1/dorms/${id}`);
};

