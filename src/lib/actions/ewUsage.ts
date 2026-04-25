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
  is_reset?: boolean;
  is_latest_editable?: boolean;
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
  duplicateInFile: number;
  duplicateInDB: number;
  failed: number;
  warnings: number;
  errors: { row: number; block: string; error: string }[];
}

export interface CreateEWUsageDto {
  block: string;
  type: 'electric' | 'water';
  meter_right?: number;
  date: string;
  term?: string;
}

export interface QuickCreateEWUsageDto {
  block: string;
  type: 'electric' | 'water';
  meter_right?: number;
  meter_increment?: number;
  date?: string;
  term?: string;
}

export interface UpdateEWUsageDto {
  type?: 'electric' | 'water';
  meter_left?: number;
  meter_right?: number;
  date?: string;
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

export const quickCreateEWUsage = async (body: QuickCreateEWUsageDto): Promise<EWUsage> => {
  return api.post<EWUsage>('ew-usages/quick-create', body);
};

export const updateEWUsage = async (id: string, body: UpdateEWUsageDto): Promise<EWUsage> => {
  return api.put<EWUsage>(`ew-usages/${id}`, body);
};

export const resetMeter = async (
  block: string,
  type: string,
  meter_right: number,
  date: string
): Promise<EWUsage> => {
  return api.put<EWUsage>('ew-usages/reset', { block, type, meter_right, date });
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

export interface RecalculateResult {
  recordsCalculated: number;
  groupsProcessed: number;
  totalStudents: number;
  message: string;
}

export interface EWInvoiceCreateResult {
  invoicesCreated: number;
  invoicesUpdated: number;
  invoicesCancelled?: number;
  totalStudents: number;
  message: string;
}

export interface EWInvoiceCreateDto {
  block?: string;
  month: number | string;
  year: number | string;
  student_id?: string;
}

export const recalculateEWUsages = async (
  body?: { block?: string; month?: number | string; year?: number | string }
): Promise<RecalculateResult> => {
  return api.post<RecalculateResult>('ew-usages/recalculate', body || {});
};

export const createEWInvoices = async (body: EWInvoiceCreateDto): Promise<EWInvoiceCreateResult> => {
  return api.post<EWInvoiceCreateResult>('ew-usages/create-invoices', body);
};

export interface MyEWRecord {
  id: string;
  term: string;
  date: string;
  type: 'electric' | 'water';
  meter_left: number;
  meter_right: number;
  consumption: number;
  unit: string;
  price_per_unit: number;
  occupied_beds: number;
  total_amount: number;   // total amount for the entire block
  amount: number;         // amount charged to the student after splitting by occupied beds
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
