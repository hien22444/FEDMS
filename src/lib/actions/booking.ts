import { api } from '../apiRequest';

// ─── Types ───

export interface NextSemesterInfo {
  semester: string;
  start_date: string;
  end_date: string;
}

export interface BookingRoomType {
  room_type: string;
  available_slots: number;
  price_per_semester: number;
  student_type: string; // 'vietnamese' | 'international'
}

export interface BookingDorm {
  dorm_id: string;
  dorm_name: string;
  dorm_code: string;
  available_slots: number;
}

export interface BookingFloor {
  floor: number;
  available_slots: number;
}

export interface BookingBlock {
  block_id: string;
  block_name: string;
  block_code: string;
  available_slots: number;
}

export interface BookingRoom {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  total_beds: number;
  available_beds: number;
  price_per_semester: number;
  has_private_bathroom: boolean;
  block: {
    id: string;
    block_name: string;
    block_code: string;
    dorm: { id: string; dorm_name: string; dorm_code: string };
  };
}

export interface BookingBed {
  id: string;
  bed_number: string;
  status: string;
}

export interface BookingInvoice {
  id: string;
  invoice_code: string;
  total_amount: number;
  payment_status: string;
  due_date: string;
}

export interface BookingRequestItem {
  id: string;
  student?: {
    full_name: string;
    student_code: string;
    phone?: string;
    user?: { email: string };
  };
  room: BookingRoom;
  bed?: { id: string; bed_number: string };
  bed_transfer?: {
    id: string;
    bed_number: string;
    room?: {
      id: string;
      room_number?: string;
      block?: { block_code?: string; block_name?: string; dorm?: { dorm_code?: string } };
    };
  } | null;
  room_transfer?: {
    id: string;
    room_number?: string;
    block?: { block_code?: string; block_name?: string; dorm?: { dorm_code?: string } };
  } | null;
  invoice?: BookingInvoice;
  payos?: {
    orderCode?: number | null;
    paymentLinkId?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
    status?: string | null;
  } | null;
  semester: string;
  start_date: string;
  end_date: string;
  status: 'awaiting_payment' | 'approved' | 'cancelled' | 'expired';
  note?: string;
  expires_at?: string;
  requested_at: string;
  checkout_date?: string | null;
}

export interface BookingListResponse {
  items: BookingRequestItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmitBookingResponse {
  booking: BookingRequestItem;
  invoice: BookingInvoice;
  payos?: {
    orderCode: number;
    paymentLinkId?: string | null;
    checkoutUrl?: string | null;
    qrCode?: string | null;
  };
}

export interface PaymentStatusResponse {
  status: string;
  paid?: boolean;
  message?: string;
  booking: BookingRequestItem;
  invoice: BookingInvoice;
  payment?: Record<string, unknown>;
  contract?: Record<string, unknown>;
  payos?: {
    orderCode?: number;
    checkoutUrl?: string | null;
    qrCode?: string | null;
  };
}

// ─── API Functions ───

export const getNextSemester = async () => {
  return api.get<NextSemesterInfo>('bookings/next-semester');
};

export const getAvailableRoomTypes = async () => {
  return api.get<BookingRoomType[]>('bookings/options/room-types');
};

export const getDormsForBooking = async (room_type: string) => {
  return api.get<BookingDorm[]>(`bookings/options/dorms?room_type=${encodeURIComponent(room_type)}`);
};

export const getFloorsForBooking = async (dorm_id: string, room_type: string) => {
  const query = new URLSearchParams({ dorm_id, room_type });
  return api.get<BookingFloor[]>(`bookings/options/floors?${query}`);
};

export const getBlocksForBooking = async (dorm_id: string, floor: number, room_type: string) => {
  const query = new URLSearchParams({ dorm_id, floor: floor.toString(), room_type });
  return api.get<BookingBlock[]>(`bookings/options/blocks?${query}`);
};

export const getRoomsForBooking = async (block_id: string, room_type: string) => {
  const query = new URLSearchParams({ block_id, room_type });
  return api.get<BookingRoom[]>(`bookings/options/rooms?${query}`);
};

export const getBedsForBooking = async (room_id: string) => {
  return api.get<BookingBed[]>(`bookings/options/beds?room_id=${room_id}`);
};

export const submitBooking = async (data: { bed_id: string; note?: string }) => {
  return api.post<SubmitBookingResponse>('bookings', data);
};

export const checkPaymentStatus = async (id: string) => {
  return api.get<PaymentStatusResponse>(`bookings/${id}/payment-status`);
};

export const getMyBookings = async (params?: { page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const qs = query.toString();
  return api.get<BookingListResponse>(`bookings/my${qs ? `?${qs}` : ''}`);
};

export const cancelBookingRequest = async (id: string) => {
  return api.patch<BookingRequestItem>(`bookings/${id}/cancel`, {});
};

export const keepBed = async (): Promise<SubmitBookingResponse> => {
  return api.post<SubmitBookingResponse>('bookings/keep-bed', {});
};

interface ContractInfo {
  id: string;
  semester: string;
  start_date: string;
  end_date: string;
  room_price: number;
  status: string;
  room: {
    room_number: string;
    room_type: string;
    floor: number;
    block?: { block_name: string; block_code: string; dorm?: { dorm_name: string; dorm_code: string } };
  };
  bed: { bed_number: string };
}

export interface CheckoutStudentInfo {
  student: {
    id: string;
    full_name: string;
    student_code: string;
    gender: string;
    student_type: string;
    email?: string;
  };
  active_contract: ContractInfo | null;
  upcoming_contract: ContractInfo | null;
}

export interface CheckoutResult {
  message: string;
  student_code: string;
  full_name: string;
  checkout_date: string;
  ew_settlement?: {
    records: Array<{
      id: string;
      type: 'electric' | 'water';
      date: string;
      meter_right: number;
      consumption: number;
      amount: number;
    }>;
    invoice: {
      invoicesCreated: number;
      invoicesUpdated: number;
      invoicesCancelled?: number;
      totalStudents: number;
      message: string;
    };
  } | null;
}

export const searchStudentForCheckout = async (studentCode: string) => {
  return api.get<CheckoutStudentInfo>(`bookings/checkout/search?student_code=${encodeURIComponent(studentCode)}`);
};

export const checkoutStudent = async (
  studentCode: string,
  body?: { electric_meter_right?: number; water_meter_right?: number; term?: string }
) => {
  return api.post<CheckoutResult>('bookings/checkout', { student_code: studentCode, ...(body || {}) });
};

export interface CfdAtRiskStudent {
  id: string;
  full_name: string;
  student_code: string;
  behavioral_score: number;
  dorm_booking_suspended: boolean;
  email?: string;
  active_contract: {
    id: string;
    semester: string;
    room: {
      room_number: string;
      room_type?: string;
      floor?: number;
      block?: { block_name?: string; block_code?: string; dorm?: { dorm_name?: string; dorm_code?: string } };
    };
    bed?: { bed_number?: string };
  } | null;
}

export interface CfdExpelResult {
  message: string;
  student_code: string;
  full_name: string;
  had_active_contract: boolean;
  dorm_booking_suspended: boolean;
}

export const fetchCfdAtRiskStudents = async () => {
  return api.get<CfdAtRiskStudent[]>('bookings/cfd-at-risk');
};

export const cfdDormExpelStudent = async (studentCode: string) => {
  return api.post<CfdExpelResult>('bookings/cfd-expel', { student_code: studentCode });
};

export interface RoommateItem {
  student_code: string;
  full_name: string;
  bed_number: string;
  phone: string;
}

export const getRoommates = async (bookingId: string) => {
  return api.get<RoommateItem[]>(`bookings/${bookingId}/roommates`);
};

export const getAllBookings = async (params?: { status?: string; search?: string; semester?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.semester) query.set('semester', params.semester);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const qs = query.toString();
  return api.get<BookingListResponse>(`bookings${qs ? `?${qs}` : ''}`);
};

export const sendEmailToStudent = async (bookingId: string, payload: { subject: string; body: string }) => {
  return api.post<{ sent: boolean; to: string }>(`bookings/${bookingId}/send-email`, payload);
};

export const sendEmailToAllStudents = async (payload: { subject: string; body: string }) => {
  return api.post<{ sent: boolean; count: number }>(`bookings/send-email-all`, payload);
};

export const createPayosLink = async (bookingId: string) =>
  api.post<{ orderCode: number; paymentLinkId: string | null; checkoutUrl: string | null; qrCode: string | null }>(
    `bookings/${bookingId}/payos-link`,
    {}
  );

export const softLockBed = async (bedId: string) =>
  api.post<{ bedId: string; locked_until: string }>('bookings/beds/soft-lock', { bed_id: bedId });

export const softUnlockBed = async (bedId: string) =>
  api.delete<{ message: string }>(`bookings/beds/soft-lock/${bedId}`);

export const getSoftLockedBeds = async () =>
  api.get<{ locked_bed_ids: string[] }>('bookings/beds/soft-locks');
