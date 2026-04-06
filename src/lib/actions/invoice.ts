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
