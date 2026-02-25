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
  total_floors?: number;
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
  const url = `dorms${query ? `?${query}` : ''}`;

  return api.get<DormListResponse>(url);
};

export const createDorm = async (body: Partial<Dorm>) => {
  return api.post<Dorm>('dorms', body);
};

export const updateDorm = async (id: string, body: Partial<Dorm>) => {
  return api.patch<Dorm>(`dorms/${id}`, body);
};

export const deleteDorm = async (id: string) => {
  return api.delete<{ message: string }>(`dorms/${id}`);
};

// ===== Block types & APIs =====

export interface Block {
  id: string;
  dorm:
    | {
        id: string;
        dorm_name: string;
        dorm_code: string;
        total_floors?: number;
      }
    | string;
  block_name: string;
  block_code: string;
  floor?: number;
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
  const url = `blocks${query ? `?${query}` : ''}`;

  return api.get<BlockListResponse>(url);
};

export const getBlockById = async (id: string) => {
  return api.get<Block>(`blocks/${id}`);
};

export const createBlock = async (body: Partial<Block>) => {
  return api.post<Block>('blocks', body);
};

export const updateBlock = async (id: string, body: Partial<Block>) => {
  return api.patch<Block>(`blocks/${id}`, body);
};

export const deleteBlock = async (id: string) => {
  return api.delete<{ message: string }>(`blocks/${id}`);
};

// ===== Room types & APIs =====

export type RoomType = string;
export type RoomStatus = 'available' | 'full' | 'maintenance' | 'inactive';

export interface Room {
  id: string;
  block:
    | {
        id: string;
        block_name: string;
        block_code: string;
        dorm?: {
          id: string;
          dorm_name: string;
          dorm_code: string;
        } | string;
      }
    | string;
  room_number: string;
  floor: number;
  room_type: RoomType;
  total_beds: number;
  available_beds: number;
  price_per_semester: number;
  status: RoomStatus;
  has_private_bathroom: boolean;
  student_type: 'vietnamese' | 'international';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomListResponse {
  items: Room[];
}

// ===== Room type pricing APIs =====

export type RoomTypePriceMap = Record<RoomType, number>;

export interface RoomTypePricingResponse {
  prices: RoomTypePriceMap;
}
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

export const fetchRooms = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const url = `rooms${query ? `?${query}` : ''}`;

  return api.get<RoomListResponse>(url);
};

export const getRoomById = async (id: string) => {
  return api.get<Room>(`rooms/${id}`);
};

export const createRoom = async (body: Partial<Room>) => {
  return api.post<Room>('rooms', body);
};

export const updateRoom = async (id: string, body: Partial<Room>) => {
  return api.patch<Room>(`rooms/${id}`, body);
};

export const deleteRoom = async (id: string) => {
  return api.delete<{ message: string }>(`rooms/${id}`);
};

export const fetchRoomTypePricing = async () => {
  return api.get<RoomTypePricingResponse>('room-type-pricing');
};

export const updateRoomTypePricing = async (prices: RoomTypePriceMap) => {
  return api.put<RoomTypePricingResponse>('room-type-pricing', { prices });
};

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
