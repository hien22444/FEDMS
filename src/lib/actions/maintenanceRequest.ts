import { api } from '../apiRequest';
import type { RoomEquipment } from './admin';

export type MaintenanceIssueType =
  | 'electrical'
  | 'water'
  | 'ac'
  | 'furniture'
  | 'cleaning'
  | 'other';

export type MaintenancePriority = 'urgent' | 'high' | 'medium' | 'low';

export type MaintenanceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'assigned'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'done'
  | 'need_rework'
  | 'cannot_fix'
  | 'cancelled';

export interface MaintenanceRoomRef {
  id?: string;
  room_number?: string;
  floor?: number;
  room_type?: string;
  block?: {
    block_name?: string;
    block_code?: string;
    dorm?: { dorm_name?: string; dorm_code?: string };
  };
}

export interface MaintenanceStudentContext {
  full_name?: string;
  student_code?: string;
}

export interface MaintenanceContext {
  student?: MaintenanceStudentContext;
  room?: MaintenanceRoomRef;
  bed?: {
    bed_number?: string;
  } | null;
}

export interface StudentMaintenanceRequest {
  id: string;
  request_code: string;
  issue_type: MaintenanceIssueType;
  priority: MaintenancePriority;
  description: string;
  evidence_urls?: string[];
  status: MaintenanceStatus | string;
  rejection_reason?: string | null;
  technician_name?: string | null;
  technician_phone?: string | null;
  scheduled_time?: string | null;
  completion_notes?: string | null;
  requested_at?: string;
  reviewed_at?: string | null;
  completed_at?: string | null;
  room?: MaintenanceRoomRef;
  bed?: {
    bed_number?: string | null;
  } | null;
  // BE populate for maintenance only selects `equipment_code template`, so keep this lightweight.
  equipment?: {
    equipment_code?: string;
    template?: {
      equipment_name?: string;
      brand?: string;
      model?: string;
    } | null;
  } | null;
  equipment_other_selected?: boolean;
  // BE populate student for getAllMaintenanceRequests
  student?: {
    full_name?: string;
    student_code?: string;
    user?: {
      email?: string;
    };
  };
}

export interface CreateMaintenanceRequestDto {
  issue_type?: MaintenanceIssueType;
  priority?: MaintenancePriority;
  description: string;
  equipment?: string;
  evidence_urls?: string[];
}

export const createMaintenanceRequest = async (dto: CreateMaintenanceRequestDto) => {
  return api.post<StudentMaintenanceRequest>('maintenance-requests/my', dto);
};

export const getMyMaintenanceRequests = async () => {
  return api.get<StudentMaintenanceRequest[]>('maintenance-requests/my');
};

export const getMyMaintenanceContext = async () => {
  return api.get<MaintenanceContext>('maintenance-requests/my/context');
};

export const getMyRoomEquipmentForMaintenance = async () => {
  return api.get<RoomEquipment[]>('maintenance-requests/my/room-equipment');
};

export interface MaintenanceRequestListResponse {
  data: StudentMaintenanceRequest[];
  total: number;
  page: number;
  limit: number;
}

export const getAllMaintenanceRequests = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return api.get<MaintenanceRequestListResponse>(`maintenance-requests${qs ? `?${qs}` : ''}`);
};

export const reviewMaintenanceRequest = async (
  id: string,
  body: {
    status: MaintenanceStatus;
    rejection_reason?: string;
    technician_name?: string;
    technician_phone?: string;
    scheduled_time?: string;
    completion_notes?: string;
  }
) => {
  return api.patch<StudentMaintenanceRequest>(`maintenance-requests/${id}/review`, body);
};
