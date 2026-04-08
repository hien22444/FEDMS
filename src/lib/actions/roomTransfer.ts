import { api } from '../apiRequest';

export type RoomTransferType = 'target_empty' | 'swap';
export type RoomTransferStatus =
  | 'pending_partner'
  | 'pending_manager'
  | 'pending_payment_upgrade'
  | 'pending_refund_office'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type PriceAdjustmentType = 'none' | 'upgrade' | 'downgrade';

export interface RoomTransferRequest {
  id: string;
  request_code: string;
  transfer_type: RoomTransferType;
  status: RoomTransferStatus;
  reason: string;
  rejection_reason?: string | null;
  requested_at: string;
  reviewed_at?: string | null;
  partner_response_at?: string | null;
  price_adjustment_type?: PriceAdjustmentType;
  supplement_amount?: number;
  payment_deadline?: string | null;
  refund_deadline?: string | null;
  refund_confirmed_at?: string | null;
  supplement_invoice?: { id: string; invoice_code?: string; total_amount?: number; payment_status?: string } | null;
  initiator_student?: {
    id: string;
    student_code: string;
    full_name: string;
    phone?: string;
    user?: { email?: string };
  } | null;
  target_student?: {
    id: string;
    student_code: string;
    full_name: string;
    phone?: string;
    user?: { email?: string };
  } | null;
  current_room?: {
    id: string;
    room_number?: string;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string; dorm_name?: string } };
  } | null;
  current_bed?: { id: string; bed_number?: string; status?: string } | null;
  requested_room?: {
    id: string;
    room_number?: string;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string; dorm_name?: string } };
  } | null;
  requested_bed?: { id: string; bed_number?: string; status?: string } | null;
}

export interface RoomTransferListResponse {
  data: RoomTransferRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransferAvailableBed {
  id: string;
  bed_number: string;
  status: string;
  room_price?: number;
  room?: {
    room_number?: string;
    price_per_semester?: number;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string; dorm_name?: string } };
  };
}

export interface BedTransferHistoryItem {
  id: string;
  transfer_source: 'manual_assignment' | 'transfer_request_empty' | 'transfer_request_swap' | string;
  note?: string | null;
  changed_at: string;
  from_room?: {
    id: string;
    room_number?: string;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string; dorm_name?: string } };
  } | null;
  from_bed?: { id: string; bed_number?: string } | null;
  to_room?: {
    id: string;
    room_number?: string;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string; dorm_name?: string } };
  } | null;
  to_bed?: { id: string; bed_number?: string } | null;
  changed_by_staff?: { id: string; full_name?: string; staff_code?: string } | null;
  transfer_request?: { id: string; request_code?: string; transfer_type?: string; status?: string } | null;
}

export interface SwapTargetPreview {
  student: { id: string; student_code: string; full_name: string };
  room?: {
    id: string;
    room_number?: string;
    price_per_semester?: number;
    block?: { block_name?: string; block_code?: string; dorm?: { dorm_code?: string; dorm_name?: string } };
  } | null;
  bed?: { id: string; bed_number?: string } | null;
  room_price?: number;
  initiator_room_price?: number;
  swap_allowed?: boolean;
}

export interface TransferReviewApproveResponse {
  transfer?: RoomTransferRequest;
  payos?: { orderCode?: number; paymentLinkId?: string | null; checkoutUrl?: string | null; qrCode?: string | null } | null;
  supplement?: { id: string; invoice_code: string; total_amount: number };
}

export interface TransferPaymentStatusResponse {
  transfer: RoomTransferRequest;
  status?: string;
  paid?: boolean;
  payos?: { orderCode?: number; checkoutUrl?: string | null; qrCode?: string | null };
}

export const createEmptyBedTransferRequest = async (payload: {
  requested_bed_id: string;
  reason: string;
}) => {
  return api.post<RoomTransferRequest>('room-transfers/my/empty-bed', payload);
};

export const createSwapTransferRequest = async (payload: {
  target_student_code: string;
  reason: string;
}) => {
  return api.post<RoomTransferRequest>('room-transfers/my/swap', payload);
};

export const getSwapTargetPreview = async (studentCode: string) => {
  return api.get<SwapTargetPreview>(`room-transfers/my/swap-target?student_code=${encodeURIComponent(studentCode)}`);
};

export const getMyTransferRequests = async () => {
  return api.get<RoomTransferRequest[]>('room-transfers/my');
};

export const getMyTransferHistory = async () => {
  return api.get<BedTransferHistoryItem[]>('room-transfers/my/history');
};

export const getAvailableBedsForTransfer = async () => {
  return api.get<TransferAvailableBed[]>('room-transfers/my/available-beds');
};

export const respondSwapTransferRequest = async (
  requestId: string,
  payload: { accept: boolean; reason?: string }
) => {
  return api.patch<RoomTransferRequest>(`room-transfers/my/${requestId}/respond`, payload);
};

export const cancelTransferRequest = async (requestId: string) => {
  return api.patch<{ message: string }>(`room-transfers/my/${requestId}/cancel`, {});
};

export const getAllTransferRequests = async (params?: {
  status?: string;
  transfer_type?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.transfer_type) query.set('transfer_type', params.transfer_type);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<RoomTransferListResponse>(`room-transfers${qs ? `?${qs}` : ''}`);
};

export const reviewTransferRequest = async (
  requestId: string,
  payload: { action: 'approve' | 'reject'; rejection_reason?: string }
) => {
  return api.patch<RoomTransferRequest | TransferReviewApproveResponse>(
    `room-transfers/${requestId}/review`,
    payload
  );
};

export const checkTransferPaymentStatus = async (requestId: string) => {
  return api.get<TransferPaymentStatusResponse>(`room-transfers/my/${requestId}/payment-status`);
};

export const confirmTransferRefundDone = async (requestId: string) => {
  return api.patch<RoomTransferRequest>(`room-transfers/${requestId}/confirm-refund`, {});
};
