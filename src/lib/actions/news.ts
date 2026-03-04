import { api } from '../apiRequest';

export type NewsCategory = 'announcement' | 'event' | 'policy' | 'maintenance' | 'general';

export interface News {
  id: string;
  title: string;
  content: string;
  thumbnail_url?: string;
  category: NewsCategory | string;
  is_published: boolean;
  published_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsListResponse {
  items: News[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  is_published?: boolean;
}

export const fetchNews = async (params?: NewsQueryParams) => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const url = `news${query ? `?${query}` : ''}`;

  return api.get<NewsListResponse>(url);
};

export const getNewsById = async (id: string) => {
  return api.get<News>(`news/${id}`);
};

export const createNews = async (
  body: Pick<News, 'title' | 'content' | 'category'> &
    Partial<Pick<News, 'thumbnail_url' | 'is_published'>>,
) => {
  return api.post<News>('news', body);
};

export const updateNews = async (
  id: string,
  body: Partial<Pick<News, 'title' | 'content' | 'category' | 'thumbnail_url' | 'is_published'>>,
) => {
  return api.patch<News>(`news/${id}`, body);
};

export const deleteNews = async (id: string) => {
  return api.delete<{ message: string }>(`news/${id}`);
};

