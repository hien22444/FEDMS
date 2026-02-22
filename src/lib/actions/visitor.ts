import { api } from '../apiRequest';
import type { IVisitor } from '@/interfaces';

// ─── Student actions ───

export const createVisitorRequest = async (dto: IVisitor.CreateVisitorRequestDto) => {
  return api.post<IVisitor.VisitorRequest>('visitors/requests', dto);
};

export const getMyVisitorRequests = async () => {
  return api.get<IVisitor.VisitorRequest[]>('visitors/requests/my');
};

export const cancelVisitorRequest = async (id: string) => {
  return api.patch<IVisitor.VisitorRequest>(`visitors/requests/${id}/cancel`, {});
};

// ─── Security actions ───

export const getAllVisitorRequests = async (params?: { status?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  const qs = query.toString();
  return api.get<IVisitor.AllRequestsResponse>(`visitors/requests${qs ? `?${qs}` : ''}`);
};

export const getVisitorRequestDetail = async (id: string) => {
  return api.get<IVisitor.VisitorRequest>(`visitors/requests/${id}`);
};

export const approveVisitorRequest = async (id: string) => {
  return api.patch<IVisitor.VisitorRequest>(`visitors/requests/${id}/approve`, {});
};

export const rejectVisitorRequest = async (id: string, reason?: string) => {
  return api.patch<IVisitor.VisitorRequest>(`visitors/requests/${id}/reject`, { reason });
};

export const completeVisitorRequest = async (id: string) => {
  return api.patch<IVisitor.VisitorRequest>(`visitors/requests/${id}/complete`, {});
};

export const checkinVisitor = async (requestId: string, visitorId: string) => {
  return api.post<IVisitor.CheckinRecord>(`visitors/requests/${requestId}/checkin`, { visitorId });
};

export const checkoutVisitor = async (checkinId: string) => {
  return api.patch<IVisitor.CheckinRecord>(`visitors/checkins/${checkinId}/checkout`, {});
};

export const getActiveVisitors = async () => {
  return api.get<IVisitor.ActiveVisitor[]>('visitors/active');
};
