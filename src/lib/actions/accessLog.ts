import { api } from '../apiRequest';
import type { IFaceRecognition } from '@/interfaces';

export const getAccessLogStats = async () => {
  return api.get<IFaceRecognition.AccessLogStats>('access-logs/stats');
};

export const getTodayAccessLogs = async () => {
  return api.get<IFaceRecognition.AccessLog[]>('access-logs/today');
};

export const getAccessLogs = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  method?: string;
  date?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.type) query.set('type', params.type);
  if (params?.method) query.set('method', params.method);
  if (params?.date) query.set('date', params.date);
  const qs = query.toString();
  return api.get<IFaceRecognition.AccessLogPaginated>(`access-logs${qs ? `?${qs}` : ''}`);
};

export const createManualLog = async (data: {
  name: string;
  idCard: string;
  type: 'check_in' | 'check_out';
  reason: 'camera_failed' | 'other';
  notes?: string;
}) => {
  return api.post<IFaceRecognition.AccessLog>('access-logs/manual', data);
};

export const getReportStats = async (date: string) => {
  return api.get<IFaceRecognition.ReportStats>(`access-logs/report-stats?date=${date}`);
};

export const exportAccessLogs = async (params: {
  startDate: string;
  endDate: string;
  type?: string;
  method?: string;
}) => {
  const query = new URLSearchParams();
  query.set('startDate', params.startDate);
  query.set('endDate', params.endDate);
  if (params.type) query.set('type', params.type);
  if (params.method) query.set('method', params.method);

  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_BASE_URL || '';
  const res = await fetch(`${baseUrl}/access-logs/export?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Export failed');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `access-logs-${params.startDate}-to-${params.endDate}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
