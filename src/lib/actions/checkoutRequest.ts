import { api } from '../apiRequest';

export type CheckoutRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CheckoutRoomRef {
  id?: string;
  room_number?: string;
  floor?: number;
  room_type?: string;
  block?: {
    block_name?: string;
    block_code?: string;
    dorm?: { dorm_name?: string; dorm_code?: string };
  };
}

export interface CheckoutInspection {
  id?: string;
  cleanliness_status: 'clean' | 'dirty' | 'needs_cleaning';
  equipment_status: 'complete' | 'missing' | 'damaged';
  equipment_notes?: string | null;
  maintenance_needed?: string | null;
  inspection_photos_urls?: string[];
  inspected_by?: { full_name?: string; staff_code?: string } | null;
  inspected_at?: string;
}

export interface StudentCheckoutRequest {
  id: string;
  request_code: string;
  expected_checkout_date: string;
  reason: string;
  status: CheckoutRequestStatus | string;
  rejection_reason?: string | null;
  requested_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: { full_name?: string; staff_code?: string } | null;
  room?: CheckoutRoomRef;
  bed?: { bed_number?: string } | null;
  contract?: { semester?: string; start_date?: string; end_date?: string; status?: string } | null;
  student?: {
    full_name?: string;
    student_code?: string;
    user?: { email?: string };
  };
  inspection?: CheckoutInspection | null;
}

export interface CreateCheckoutRequestDto {
  expected_checkout_date: string;
  reason: string;
}

export const createCheckoutRequest = async (dto: CreateCheckoutRequestDto) => {
  return api.post<StudentCheckoutRequest>('checkout-requests/my', dto);
};

export const getMyCheckoutRequests = async () => {
  return api.get<StudentCheckoutRequest[]>('checkout-requests/my');
};

export const cancelCheckoutRequest = async (id: string) => {
  return api.patch<{ id: string; status: string }>(`checkout-requests/my/${id}/cancel`, {});
};

// ── Security ─────────────────────────────────────────────────────────────────

export const getApprovedCheckoutRequests = async () => {
  return api.get<CheckoutRequestListResponse>('checkout-requests/approved');
};

export const getCheckoutInspectionHistory = async (params?: { page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<CheckoutRequestListResponse>(`checkout-requests/history${qs ? `?${qs}` : ''}`);
};

export interface InspectCheckoutDto {
  cleanliness_status: 'clean' | 'dirty' | 'needs_cleaning';
  equipment_status: 'complete' | 'missing' | 'damaged';
  equipment_notes?: string;
  maintenance_needed?: string;
  inspection_photos_urls?: string[];
}

export const inspectCheckoutRequest = async (id: string, body: InspectCheckoutDto) => {
  return api.patch<StudentCheckoutRequest>(`checkout-requests/${id}/inspect`, body);
};

// ── Manager ──────────────────────────────────────────────────────────────────

export interface CheckoutRequestListResponse {
  data: StudentCheckoutRequest[];
  total: number;
  page: number;
  limit: number;
}

export const getAllCheckoutRequests = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<CheckoutRequestListResponse>(`checkout-requests${qs ? `?${qs}` : ''}`);
};

export const completeCheckoutRequest = async (id: string) => {
  return api.patch<StudentCheckoutRequest>(`checkout-requests/${id}/complete`, {});
};

export const reviewCheckoutRequest = async (
  id: string,
  body: { status: 'approved' | 'rejected'; rejection_reason?: string }
) => {
  return api.patch<StudentCheckoutRequest>(`checkout-requests/${id}/review`, body);
};
