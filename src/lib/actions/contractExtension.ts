import { api } from '../apiRequest';

export type ExtensionStatus = 'pending' | 'approved' | 'rejected';

export interface ContractExtensionItem {
  id: string;
  extension_months: number;
  additional_cost: number;
  new_end_date: string;
  status: ExtensionStatus | string;
  requested_at: string;
  reviewed_at?: string | null;
  reviewed_by?: { full_name?: string; staff_code?: string } | null;
  rejection_reason?: string | null;
  student?: {
    full_name?: string;
    student_code?: string;
    user?: { email?: string };
  };
  contract?: {
    semester?: string;
    start_date?: string;
    end_date?: string;
    room_price?: number;
    status?: string;
    room?: {
      room_number?: string;
      room_type?: string;
      block?: {
        block_name?: string;
        dorm?: { dorm_name?: string };
      };
    };
  };
  invoice?: {
    id?: string;
    invoice_code?: string;
    total_amount?: number;
    payment_status?: string;
    due_date?: string;
  } | null;
}

export interface CreateExtensionRequestDto {
  extension_months: number;
}

export interface ExtensionListResponse {
  data: ContractExtensionItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ExtensionStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// ── Student ───────────────────────────────────────────────────────────────────

export const createExtensionRequest = async (dto: CreateExtensionRequestDto) => {
  return api.post<ContractExtensionItem>('contract-extensions/my', dto);
};

export const getMyExtensionRequests = async () => {
  return api.get<ContractExtensionItem[]>('contract-extensions/my');
};

export const cancelExtensionRequest = async (id: string) => {
  return api.patch<{ id: string; status: string }>(`contract-extensions/my/${id}/cancel`, {});
};

// ── Manager ───────────────────────────────────────────────────────────────────

export const getAllExtensionRequests = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<ExtensionListResponse>(`contract-extensions${qs ? `?${qs}` : ''}`);
};

export const getExtensionRequestById = async (id: string) => {
  return api.get<ContractExtensionItem>(`contract-extensions/${id}`);
};

export const reviewExtensionRequest = async (
  id: string,
  body: { status: 'approved' | 'rejected'; rejection_reason?: string }
) => {
  return api.patch<ContractExtensionItem>(`contract-extensions/${id}/review`, body);
};

export const getExtensionStats = async () => {
  return api.get<ExtensionStats>('contract-extensions/stats');
};
