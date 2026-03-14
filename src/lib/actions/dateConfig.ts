import { api } from '../apiRequest';

export interface DateWindow {
  start: string | null;
  end: string | null;
}

export interface DateConfigResponse {
  hold_window: DateWindow;
  new_booking_window: DateWindow;
}

export interface BookingWindowStatusResponse {
  allowed: boolean;
  window_type: 'hold' | 'new' | null;
}

export const getDateConfig = async (): Promise<DateConfigResponse> => {
  return api.get<DateConfigResponse>('date-config');
};

export const updateDateConfig = async (data: {
  hold_window: { start: string | null; end: string | null };
  new_booking_window: { start: string | null; end: string | null };
}): Promise<DateConfigResponse> => {
  return api.put<DateConfigResponse>('date-config', data);
};

export const getBookingWindowStatus = async (): Promise<BookingWindowStatusResponse> => {
  return api.get<BookingWindowStatusResponse>('bookings/window-status');
};
