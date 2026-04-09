import { api } from '../apiRequest';

export interface DateWindow {
  start: string | null;
  end: string | null;
}

export interface TargetSemester {
  semester: 'Spring' | 'Summer' | 'Fall' | null;
  year: number | null;
}

export interface DateConfigResponse {
  hold_window: DateWindow;
  new_booking_window: DateWindow;
  target_semester: TargetSemester;
}

export interface BookingWindowStatusResponse {
  allowed: boolean;
  window_type: 'hold' | 'new' | null;
  /** Backend sets when student.dorm_booking_suspended (CFD expulsion) */
  dorm_booking_suspended?: boolean;
}

export const getDateConfig = async (): Promise<DateConfigResponse> => {
  return api.get<DateConfigResponse>('date-config');
};

export const updateDateConfig = async (data: {
  hold_window: { start: string | null; end: string | null };
  new_booking_window: { start: string | null; end: string | null };
  target_semester: { semester: string | null; year: number | null };
}): Promise<DateConfigResponse> => {
  return api.put<DateConfigResponse>('date-config', data);
};

export const getBookingWindowStatus = async (): Promise<BookingWindowStatusResponse> => {
  return api.get<BookingWindowStatusResponse>('bookings/window-status');
};
