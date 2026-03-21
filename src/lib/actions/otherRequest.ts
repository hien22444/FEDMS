import { api } from '../apiRequest';

export interface OtherRequestItem {
  id: string;
  request_code: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected' | string;
  rejection_reason?: string | null;
  manager_response?: string | null;
  user?: {
    id?: string;
    fullname?: string;
    email?: string;
    role?: string;
    student_code?: string;
  };
  reviewed_by?: {
    id?: string;
    fullname?: string;
    email?: string;
    role?: string;
  } | null;
  reviewed_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOtherRequestDto {
  title: string;
  description: string;
}

export const createOtherRequest = async (dto: CreateOtherRequestDto) => {
  return api.post<OtherRequestItem>('other-requests/my', dto);
};

export const getMyOtherRequests = async () => {
  return api.get<OtherRequestItem[]>('other-requests/my');
};

export interface OtherRequestListResponse {
  data: OtherRequestItem[];
  total: number;
  page: number;
  limit: number;
}

export const getAllOtherRequests = async (params?: { status?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<OtherRequestListResponse>(`other-requests${qs ? `?${qs}` : ''}`);
};

export const reviewOtherRequest = async (
  id: string,
  body: {
    status: 'in_review' | 'resolved' | 'rejected';
    rejection_reason?: string;
    manager_response?: string;
  }
) => {
  return api.patch<OtherRequestItem>(`other-requests/${id}/review`, body);
};
