import { api } from '../apiRequest';

export interface EWUsage {
  id: string;
  block: string;
  dorm: string;
  block_name: string;
  type: 'electric' | 'water';
  meter_left: number;
  meter_right: number;
  consumption: number;
  date: string;
  term: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface EWUsageFilter {
  block_name?: string;
  type?: 'electric' | 'water';
  month?: number | string;
  year?: number | string;
  page?: number;
  limit?: number;
}

export interface EWUsagePaginatedResponse {
  data: EWUsage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EWImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: { row: number; block: string; error: string }[];
}

export interface CreateEWUsageDto {
  block: string;
  type: 'electric' | 'water';
  meter_left: number;
  meter_right?: number;
  date: string;
  term: string;
}

export interface UpdateEWUsageDto {
  type?: 'electric' | 'water';
  meter_left?: number;
  meter_right?: number;
  date?: string;
  term?: string;
}

export const getEWUsages = async (params?: EWUsageFilter): Promise<EWUsagePaginatedResponse> => {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
    : '';
  return api.get<EWUsagePaginatedResponse>(`ew-usages${query}`);
};

export const createEWUsage = async (body: CreateEWUsageDto): Promise<EWUsage> => {
  return api.post<EWUsage>('ew-usages', body);
};

export const updateEWUsage = async (id: string, body: UpdateEWUsageDto): Promise<EWUsage> => {
  return api.put<EWUsage>(`ew-usages/${id}`, body);
};

export const resetMeter = async (id: string): Promise<EWUsage> => {
  return api.put<EWUsage>(`ew-usages/${id}/reset`, {});
};

export const importEWUsages = async (file: File): Promise<EWImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<EWImportResult>('ew-usages/import', formData);
};

export const exportEWUsages = async (params?: EWUsageFilter): Promise<void> => {
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') ?? '';
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
    : '';

  const res = await fetch(`${baseUrl}/ew-usages/export${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Export failed');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ew-usages.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};

export const recalculateEWUsages = async (): Promise<{ message: string }> => {
  return api.post<{ message: string }>('ew-usages/recalculate', {});
};

export interface MyEWRecord {
  id: string;
  term: string;
  date: string;
  meter_left: number;
  meter_right: number;
  consumption: number;
  unit: string;
  price_per_unit: number;
  occupied_beds: number;
  total_amount: number;   // tổng tiền cả block
  amount: number;         // tiền sinh viên phải trả (chia đều theo số bed)
}

export interface MyEWUsageResponse {
  block_name: string | null;
  room_number: string | null;
  data: MyEWRecord[];
  message?: string;
}

export const getMyEWUsages = async (): Promise<MyEWUsageResponse> => {
  return api.get<MyEWUsageResponse>('ew-usages/my');
};
