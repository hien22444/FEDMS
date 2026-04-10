import { api } from '../apiRequest';

export interface InvoiceLineItem {
  item_type: 'room_fee' | 'electricity' | 'water' | 'service' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface StudentInvoice {
  id: string;
  invoice_code: string;
  invoice_month: string;
  room_fee: number;
  electricity_fee: number;
  water_fee: number;
  service_fee: number;
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  createdAt: string;
  room?: { room_number: string };
  line_items: InvoiceLineItem[];
  payos?: {
    orderCode?: number | null;
    paymentLinkId?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
    status?: string | null;
  } | null;
}

export const getMyInvoices = async (): Promise<StudentInvoice[]> => {
  return api.get<StudentInvoice[]>('invoices/my');
};

export interface InvoicePaymentLinkResponse {
  invoice: StudentInvoice;
  payos?: {
    orderCode?: number | null;
    paymentLinkId?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
    status?: string | null;
  } | null;
}

export interface InvoicePaymentStatusResponse {
  status: string;
  paid?: boolean;
  message?: string;
  invoice: StudentInvoice;
  payos?: {
    orderCode?: number | null;
    paymentLinkId?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
    status?: string | null;
  } | null;
}

export const createInvoicePayosLink = async (id: string) => {
  return api.post<InvoicePaymentLinkResponse>(`invoices/${id}/payos-link`, {});
};

export const getInvoicePaymentStatus = async (id: string) => {
  return api.get<InvoicePaymentStatusResponse>(`invoices/${id}/payment-status`);
};

// ─── Manager APIs ─────────────────────────────────────────────────────────────

export interface ManagerInvoice {
  id: string;
  invoice_code: string;
  invoice_month: string;
  room_fee: number;
  electricity_fee: number;
  water_fee: number;
  service_fee: number;
  other_fees: number;
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  createdAt: string;
  student?: { id: string; full_name: string; student_code: string; phone?: string };
  room?: { id: string; room_number: string; block?: { block_name: string; block_code: string } };
  line_items: InvoiceLineItem[];
}

export interface ManagerInvoiceListResponse {
  data: ManagerInvoice[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ManagerInvoiceFilter {
  page?: number;
  limit?: number;
  payment_status?: string;
  invoice_month?: string;
  student_code?: string;
  room_id?: string;
  block_id?: string;
}

export interface CreateInvoiceDto {
  student_code: string;
  invoice_month: string;
  room_fee?: number;
  electricity_fee?: number;
  water_fee?: number;
  service_fee?: number;
  other_fees?: number;
  other_fees_description?: string;
  due_date: string;
}

export interface BulkInvoiceDto {
  invoice_month: string;
  room_fee?: number;
  electricity_fee?: number;
  water_fee?: number;
  service_fee?: number;
  other_fees?: number;
  other_fees_description?: string;
  due_date: string;
}

export interface BulkInvoiceResult {
  created: number;
  invoices: ManagerInvoice[];
}

export const getManagerInvoices = async (params?: ManagerInvoiceFilter): Promise<ManagerInvoiceListResponse> => {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
    : '';
  return api.get<ManagerInvoiceListResponse>(`invoices${query}`);
};

export const getManagerInvoiceDetail = async (id: string): Promise<ManagerInvoice> => {
  return api.get<ManagerInvoice>(`invoices/${id}`);
};

export const createInvoiceForStudent = async (body: CreateInvoiceDto): Promise<ManagerInvoice> => {
  return api.post<ManagerInvoice>('invoices', body);
};

export const createInvoicesForRoom = async (roomId: string, body: BulkInvoiceDto): Promise<BulkInvoiceResult> => {
  return api.post<BulkInvoiceResult>(`invoices/bulk/room/${roomId}`, body);
};

export const createInvoicesForBlock = async (blockId: string, body: BulkInvoiceDto): Promise<BulkInvoiceResult> => {
  return api.post<BulkInvoiceResult>(`invoices/bulk/block/${blockId}`, body);
};

export const cancelManagerInvoice = async (id: string): Promise<ManagerInvoice> => {
  return api.patch<ManagerInvoice>(`invoices/${id}/cancel`, {});
};

export const deleteManagerInvoice = async (id: string): Promise<{ deleted: boolean }> => {
  return api.delete<{ deleted: boolean }>(`invoices/${id}`);
};
