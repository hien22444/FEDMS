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

// ===== Equipment Category types & APIs =====

export interface EquipmentCategory {
  id: string;
  category_name: string;
  description?: string;
  created_at: string;
}

export interface EquipmentCategoryListResponse {
  items: EquipmentCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchEquipmentCategories = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }
  const query = searchParams.toString();
  return api.get<EquipmentCategoryListResponse>(`equipment/categories${query ? `?${query}` : ''}`);
};

export const createEquipmentCategory = async (body: Partial<EquipmentCategory>) => {
  return api.post<EquipmentCategory>('equipment/categories', body);
};

export const updateEquipmentCategory = async (id: string, body: Partial<EquipmentCategory>) => {
  return api.patch<EquipmentCategory>(`equipment/categories/${id}`, body);
};

export const deleteEquipmentCategory = async (id: string) => {
  return api.delete<{ message: string }>(`equipment/categories/${id}`);
};

// ===== Equipment Template types & APIs =====

export interface EquipmentTemplate {
  id: string;
  category: { id: string; category_name: string } | string;
  equipment_name: string;
  brand?: string;
  model?: string;
  specifications?: string;
  estimated_lifespan_years?: number;
  unit_price?: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentTemplateListResponse {
  items: EquipmentTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchEquipmentTemplates = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }
  const query = searchParams.toString();
  return api.get<EquipmentTemplateListResponse>(`equipment/templates${query ? `?${query}` : ''}`);
};

export const createEquipmentTemplate = async (body: Partial<EquipmentTemplate>) => {
  return api.post<EquipmentTemplate>('equipment/templates', body);
};

export const updateEquipmentTemplate = async (id: string, body: Partial<EquipmentTemplate>) => {
  return api.patch<EquipmentTemplate>(`equipment/templates/${id}`, body);
};

export const deleteEquipmentTemplate = async (id: string) => {
  return api.delete<{ message: string }>(`equipment/templates/${id}`);
};

// ===== Room Type Equipment Config types & APIs =====

export interface RoomTypeEquipmentConfig {
  id: string;
  room_type: '2_person' | '4_person' | '6_person' | '8_person';
  template: {
    id: string;
    equipment_name: string;
    brand?: string;
    model?: string;
    category?: { id: string; category_name: string };
  } | string;
  standard_quantity: number;
  is_mandatory: boolean;
  created_at: string;
}

export interface RoomTypeConfigListResponse {
  items: RoomTypeEquipmentConfig[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const fetchRoomTypeConfigs = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }
  const query = searchParams.toString();
  return api.get<RoomTypeConfigListResponse>(`equipment/room-type-configs${query ? `?${query}` : ''}`);
};

export const createRoomTypeConfig = async (body: Partial<RoomTypeEquipmentConfig>) => {
  return api.post<RoomTypeEquipmentConfig>('equipment/room-type-configs', body);
};

export const updateRoomTypeConfig = async (id: string, body: Partial<RoomTypeEquipmentConfig>) => {
  return api.patch<RoomTypeEquipmentConfig>(`equipment/room-type-configs/${id}`, body);
};

export const deleteRoomTypeConfig = async (id: string) => {
  return api.delete<{ message: string }>(`equipment/room-type-configs/${id}`);
};
