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
}

export const getMyInvoices = async (): Promise<StudentInvoice[]> => {
  return api.get<StudentInvoice[]>('invoices/my');
};
