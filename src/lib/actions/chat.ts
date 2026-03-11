import { api } from '../apiRequest';

// ─── Types ────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  email: string;
  fullname: string | null;
}

export interface ChatConversation {
  id: string;
  student: ChatUser;
  staff: ChatUser | null;
  status: 'open' | 'closed';
  manager_unread: number;
  student_unread: number;
  last_message_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversation: string;
  sender: ChatUser;
  sender_type: 'student' | 'staff';
  message_text: string;
  attachment_url?: string;
  is_read: boolean;
  sent_at: string;
}

export interface ConversationListResponse {
  items: ChatConversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessagesResponse {
  conversation: ChatConversation;
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Student API ─────────────────────────────────────────

export const getMyConversation = () =>
  api.get<ChatConversation>('chat/my-conversation');

export const getMyConversations = (params?: { page?: number; limit?: number }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.append(k, String(v));
    });
  }
  const query = searchParams.toString();
  return api.get<ConversationListResponse>(`chat/my-conversations${query ? `?${query}` : ''}`);
};

export const closeMyConversation = () =>
  api.patch<ChatConversation>('chat/my-conversation/close', {});

// ─── Manager API ─────────────────────────────────────────

export const getConversations = (params?: {
  status?: 'open' | 'closed' | 'all';
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.append(k, String(v));
    });
  }
  const query = searchParams.toString();
  return api.get<ConversationListResponse>(`chat/conversations${query ? `?${query}` : ''}`);
};

export const assignConversation = (id: string) =>
  api.patch<ChatConversation>(`chat/conversations/${id}/assign`, {});

export const closeConversation = (id: string) =>
  api.patch<ChatConversation>(`chat/conversations/${id}/close`, {});

// ─── Shared API ──────────────────────────────────────────

export const getMessages = (id: string, params?: { page?: number; limit?: number }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.append(k, String(v));
    });
  }
  const query = searchParams.toString();
  return api.get<MessagesResponse>(`chat/conversations/${id}/messages${query ? `?${query}` : ''}`);
};

export const markAsRead = (id: string) =>
  api.patch<{ message: string }>(`chat/conversations/${id}/read`, {});
