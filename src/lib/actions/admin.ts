import { api } from '../apiRequest';

// Reuse BE structure (BEDMS auth.service login response)
export interface AdminLoginResponse {
  token: string;
  refreshToken: string;
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
  }
  if (res.refreshToken) {
    localStorage.setItem('refreshToken', res.refreshToken);
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

// ===== Block types & APIs =====

export interface Block {
  id: string;
  dorm: {
    id: string;
    dorm_name: string;
    dorm_code: string;
  } | string;
  block_name: string;
  block_code: string;
  floor_count?: number;
  total_rooms?: number;
  gender_type: 'male' | 'female' | 'mixed';
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockListResponse {
  items: Block[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchBlocks = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const url = `v1/blocks${query ? `?${query}` : ''}`;

  return api.get<BlockListResponse>(url);
};

export const getBlockById = async (id: string) => {
  return api.get<Block>(`v1/blocks/${id}`);
};

export const createBlock = async (body: Partial<Block>) => {
  return api.post<Block>('v1/blocks', body);
};

export const updateBlock = async (id: string, body: Partial<Block>) => {
  return api.patch<Block>(`v1/blocks/${id}`, body);
};

export const deleteBlock = async (id: string) => {
  return api.delete<{ message: string }>(`v1/blocks/${id}`);
};

// ===== User List APIs =====

export interface UserRecord {
  id: string;
  email: string;
  fullname: string | null;
  role: string;
  is_active: boolean;
  last_login: string | null;
  createdAt: string;
  code: string | null;
  phone: string | null;
  gender: string | null;
  major: string | null;
  cohort: string | null;
}

export interface UserListResponse {
  items: UserRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchUsers = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const url = `users${query ? `?${query}` : ''}`;

  return api.get<UserListResponse>(url);
};

export const deleteUser = async (id: string) => {
  return api.delete<{ message: string }>(`users/${id}`);
};

// ===== Import Excel APIs =====

export interface ImportedRecord {
  row: number;
  sheet: string;
  email: string;
  role: string;
  code: string;
}

export interface ImportError {
  row: number;
  sheet: string;
  email: string;
  error: string;
}

export interface ImportExcelResponse {
  summary: {
    total: number;
    success: number;
    failed: number;
  };
  imported: ImportedRecord[];
  errors: ImportError[];
  warnings: string[];
}

export const importUsersFromExcel = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<ImportExcelResponse>('users/import-excel', formData);
};
