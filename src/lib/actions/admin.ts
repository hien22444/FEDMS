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
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  room_type: string;
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

// ===== Room Equipment types & APIs =====

export interface RoomEquipment {
  id: string;
  room: string;
  template: {
    id: string;
    equipment_name: string;
    brand?: string;
    model?: string;
    category?: { id: string; category_name: string };
  } | string;
  equipment_code: string;
  quantity: number;
  status: 'good' | 'normal' | 'damaged' | 'broken' | 'missing';
  condition_notes?: string;
  assigned_at: string;
}

export interface RoomEquipmentListResponse {
  items: RoomEquipment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const addRoomEquipment = async (body: { room: string; template: string; quantity?: number }) => {
  return api.post<RoomEquipment>('equipment/room-equipments', body);
};

export const fetchRoomEquipments = async (params?: Record<string, string | number | boolean>) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) searchParams.append(key, String(value));
    });
  }
  const query = searchParams.toString();
  return api.get<RoomEquipmentListResponse>(`equipment/room-equipments${query ? `?${query}` : ''}`);
};

export const deleteRoomEquipment = async (id: string) => {
  return api.delete<{ message: string }>(`equipment/room-equipments/${id}`);
};

export const updateRoomEquipment = async (id: string, body: { quantity?: number; status?: string; condition_notes?: string }) => {
  return api.patch<RoomEquipment>(`equipment/room-equipments/${id}`, body);
};

export interface EquipmentHistoryItem {
  id: string;
  equipment: string;
  action_type: 'added' | 'removed' | 'repaired' | 'replaced' | 'status_changed' | 'moved' | string;
  old_status?: string;
  new_status?: string;
  old_room?: string | null;
  new_room?: string | null;
  notes?: string;
  performed_by?: { id?: string; full_name?: string; staff_code?: string } | null;
  performed_at: string;
}

export interface EquipmentHistoryResponse {
  items: EquipmentHistoryItem[];
  repairedCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const fetchRoomEquipmentHistory = async (id: string, params?: { page?: number; limit?: number; action_type?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.action_type) query.set('action_type', params.action_type);
  const qs = query.toString();
  return api.get<EquipmentHistoryResponse>(`equipment/room-equipments/${id}/history${qs ? `?${qs}` : ''}`);
};

// ===== Bed Management =====

export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface BedStudent {
  id: string;
  full_name: string;
  student_code: string;
  phone?: string;
  gender?: string;
  user?: { email: string };
}

export interface BedContract {
  id: string;
  student: BedStudent;
  semester: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface Bed {
  id: string;
  bed_id: number;
  bed_number: string;
  status: BedStatus;
  room: {
    id: string;
    room_number: string;
    total_beds: number;
    available_beds: number;
    student_type: string;
    block: {
      id: string;
      block_name: string;
      block_code: string;
      gender_type: string;
      dorm: { id: string; dorm_name: string; dorm_code: string };
    };
  };
  active_contract: BedContract | null;
  upcoming_contract: BedContract | null;
  createdAt: string;
  updatedAt: string;
}

export interface BedListResponse {
  items: Bed[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface BedTransferHistoryItem {
  id: string;
  student?: { id: string; student_code?: string; full_name?: string } | null;
  from_room?: {
    id: string;
    room_number?: string;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string } };
  } | null;
  from_bed?: { id: string; bed_number?: string } | null;
  to_room?: {
    id: string;
    room_number?: string;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string } };
  } | null;
  to_bed?: { id: string; bed_number?: string } | null;
  transfer_source: string;
  changed_by_staff?: { id: string; full_name?: string; staff_code?: string } | null;
  changed_at: string;
}

export interface BedTransferHistoryResponse {
  items: BedTransferHistoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const buildQuery = (params?: Record<string, string | number | boolean>) => {
  const sp = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.append(k, String(v)); });
  return sp.toString();
};

export const fetchBeds = async (params?: Record<string, string | number | boolean>) => {
  const q = buildQuery(params);
  return api.get<BedListResponse>(`beds${q ? `?${q}` : ''}`);
};

export const fetchBedsByRoom = async (roomId: string) => {
  return api.get<Bed[]>(`beds/room/${roomId}`);
};

export const fetchBedById = async (id: string) => {
  return api.get<Bed>(`beds/${id}`);
};

export const updateBedStatus = async (id: string, status: BedStatus) => {
  return api.patch<Bed>(`beds/${id}/status`, { status });
};

export const changeBedAssignment = async (sourceBedId: string, targetBedId: string) => {
  return api.patch<{ message: string }>('beds/assignment/change', {
    source_bed: sourceBedId,
    target_bed: targetBedId,
  });
};

export const fetchBedTransferHistory = async (params?: Record<string, string | number | boolean>) => {
  const q = buildQuery(params);
  return api.get<BedTransferHistoryResponse>(`beds/assignment/history${q ? `?${q}` : ''}`);
};

// ===== Dashboard Stats =====

export interface DashboardStatsResponse {
  totalDorms: number;
  totalBlocks: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  pendingRequests: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  bedUsageByBlock: { block: string; occupancyRate: number }[];
}

let _dashboardCache: DashboardStatsResponse | null = null;
let _dashboardCacheTime = 0;
const DASHBOARD_CACHE_TTL = 60_000; // 1 minute

// ===== Dorm Rules Knowledge Base =====

export interface DormRulesPenalty {
  fine_vnd?: number;
  description?: string;
  repeat_penalty?: string;
}

export interface DormRule {
  id: string;
  category: string;
  title: string;
  rule: string;
  details?: string;
  keywords?: string[];
  example_questions?: string[];
  allowed_devices?: string[];
  penalty?: DormRulesPenalty;
}

export interface DormRulesKB {
  knowledge_base?: {
    source?: string;
    issued_date?: string;
    language?: string;
    version?: string;
  };
  rules: DormRule[];
  system_instructions?: {
    assistant_role?: string;
    response_rules?: string[];
  };
}

export const fetchDormRules = async (): Promise<DormRulesKB | null> => {
  return api.get<DormRulesKB | null>('agents/dorm-rules');
};

export const updateDormRules = async (kb: DormRulesKB): Promise<{ message: string }> => {
  return api.put<{ message: string }>('agents/dorm-rules', kb);
};

export interface DormRuleFile {
  id: string;
  original_name: string;
  file_extension: string;
  file_url: string;
  cloudinary_public_id: string;
  mime_type: string;
  file_size: number;
  is_featured: boolean;
  uploaded_by: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DormRuleFileListResponse {
  items: DormRuleFile[];
}

export const fetchDormRuleFiles = async (): Promise<DormRuleFileListResponse> => {
  return api.get<DormRuleFileListResponse>('agents/dorm-rules/files');
};

export interface DormRuleFileAccessUrlResponse {
  url: string;
}

export const getDormRuleFileAccessUrl = async (
  id: string,
  attachment = false
): Promise<DormRuleFileAccessUrlResponse> => {
  const query = attachment ? '?attachment=true' : '';
  return api.get<DormRuleFileAccessUrlResponse>(`agents/dorm-rules/files/${id}/access-url${query}`);
};

export const downloadDormRuleFile = async (id: string): Promise<Blob> => {
  return api.get<Blob>(`agents/dorm-rules/files/${id}/download`, {
    responseType: 'blob',
  });
};

export const uploadDormRuleFile = async (file: File): Promise<DormRuleFile> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<DormRuleFile>('agents/dorm-rules/files', formData);
};

export const setDormRuleFileFeatured = async (id: string): Promise<DormRuleFile> => {
  return api.patch<DormRuleFile>(`agents/dorm-rules/files/${id}/feature`, null);
};

export const deleteDormRuleFile = async (id: string): Promise<{ message: string }> => {
  return api.delete<{ message: string }>(`agents/dorm-rules/files/${id}`);
};

export const fetchDashboardStats = async (force = false): Promise<DashboardStatsResponse> => {
  if (!force && _dashboardCache && Date.now() - _dashboardCacheTime < DASHBOARD_CACHE_TTL) {
    return _dashboardCache;
  }
  const result = await api.get<DashboardStatsResponse>('stats/dashboard');
  if (result) {
    _dashboardCache = result;
    _dashboardCacheTime = Date.now();
  }
  return result;
};

// ===== Bed Usage Stats =====

export interface BedUsageBucket {
  totalBeds: number;
  usedBeds: number;
  freeBeds: number;
  maintenanceBeds: number;
}

export interface BedUsageRoomType extends BedUsageBucket {
  roomType: string;
}

export interface BedUsageDorm {
  dormName: string;
  dormCode: string;
  roomTypes: BedUsageRoomType[];
  dormTotal: BedUsageBucket;
}

export interface BedUsageStatsResponse {
  grandTotal: BedUsageBucket;
  byDormAndRoomType: BedUsageDorm[];
  byRoomType: BedUsageRoomType[];
}

export const fetchBedUsageStats = async (): Promise<BedUsageStatsResponse> => {
  return api.get<BedUsageStatsResponse>('stats/bed-usage');
};
