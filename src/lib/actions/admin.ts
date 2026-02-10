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

// ===== Room types & APIs =====

export type RoomType = '2_person' | '4_person' | '6_person' | '8_person';
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
  has_ac: boolean;
  has_water_heater: boolean;
  has_private_bathroom: boolean;
  area_sqm?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomListResponse {
  items: Room[];
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
  const url = `v1/rooms${query ? `?${query}` : ''}`;

  return api.get<RoomListResponse>(url);
};

export const getRoomById = async (id: string) => {
  return api.get<Room>(`v1/rooms/${id}`);
};

export const createRoom = async (body: Partial<Room>) => {
  return api.post<Room>('v1/rooms', body);
};

export const updateRoom = async (id: string, body: Partial<Room>) => {
  return api.patch<Room>(`v1/rooms/${id}`, body);
};

export const deleteRoom = async (id: string) => {
  return api.delete<{ message: string }>(`v1/rooms/${id}`);
};
