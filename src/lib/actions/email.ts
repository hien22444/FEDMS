import { api } from '../apiRequest';

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  _id: string;
  subject: string;
  recipient_count: number;
  recipients_preview: string[];
  filters_used: EmailFilters;
  sent_by: { email: string; fullname: string };
  status: 'sent' | 'failed' | 'partial';
  error?: string;
  createdAt: string;
}

export interface EmailFilters {
  dorm_id?: string;
  block_id?: string;
  gender?: string;
  student_type?: string;
  student_code_prefix?: string;
  room_type?: string;
  semester?: string;
  invoice_status?: string;
  behavioral_score_max?: string;
}

export interface EmailStudentPreview {
  _id: string;
  email: string;
  full_name: string;
  student_code: string;
  behavioral_score?: number;
}

export interface EmailFilterOptions {
  room_types: string[];
  semesters: string[];
}

const buildQuery = (obj: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== '') p.append(k, v); });
  const q = p.toString();
  return q ? `?${q}` : '';
};

export const previewEmailRecipients = (filters: EmailFilters) =>
  api.get<{ count: number; students: EmailStudentPreview[] }>(
    `emails/students/preview${buildQuery(filters as Record<string, string | undefined>)}`
  );

export const getEmailFilterOptions = () =>
  api.get<EmailFilterOptions>('emails/filter-options');

export const sendEmailCampaign = (payload: {
  subject: string;
  body: string;
  filters: EmailFilters;
  extra_emails?: string[];
}) => api.post<{ sent: boolean; count: number }>('emails/send', payload);

export const uploadInlineImage = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('image', file);
  const res = await api.post<{ url: string }>('emails/upload-image', fd);
  return res.url;
};

export const getEmailTemplates = () =>
  api.get<{ items: EmailTemplate[] }>('emails/templates');

export const createEmailTemplate = (payload: { name: string; subject: string; body: string }) =>
  api.post<EmailTemplate>('emails/templates', payload);

export const updateEmailTemplate = (id: string, payload: { name: string; subject: string; body: string }) =>
  api.put<EmailTemplate>(`emails/templates/${id}`, payload);

export const deleteEmailTemplate = (id: string) =>
  api.delete(`emails/templates/${id}`);

export const getEmailHistory = (page = 1, limit = 20) =>
  api.get<{
    items: EmailLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`emails/history?page=${page}&limit=${limit}`);
