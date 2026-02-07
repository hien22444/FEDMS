/* eslint-disable @typescript-eslint/no-explicit-any */

import { ROUTES } from '@/constants';

class ApiRequest {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BASE_URL || '';
  }

  private async request<T>(
    url: string,
    config: RequestInit = {},
  ): Promise<T> {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Accept-Language': 'vi',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(config.headers as Record<string, string>),
    };

    if (
      config.body &&
      typeof config.body === 'object' &&
      !(config.body instanceof FormData)
    ) {
      config.body = JSON.stringify(config.body);
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${this.baseUrl}/${url}`, {
      ...config,
      headers,
    });

    const response = await res.json();

    if (!res.ok || response.success === false) {
      const error = {
        statusCode: res.status,
        message: response.message || ['Có lỗi xảy ra'],
      };

      if (res.status === 401) {
        // Remove invalid token
        localStorage.removeItem('token');

        // Only redirect if not already on signin page (avoid redirect loop)
        if (!window.location.pathname.includes('/signin') &&
            !window.location.pathname.includes('/auth/google/callback')) {
          window.location.href = ROUTES.SIGN_IN;
        }
        return Promise.reject(error);
      }

      throw error;
    }

    // Handle both formats: { data: T } and { success: true, data: T }
    return response.data as T;
  }

  async get<T>(url: string, config: RequestInit = {}) {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, body: any, config: RequestInit = {}) {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body,
    });
  }

  async put<T>(url: string, body: any, config: RequestInit = {}) {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body,
    });
  }

  async delete<T>(url: string, config: RequestInit = {}) {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  async patch<T>(url: string, body: any, config: RequestInit = {}) {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body,
    });
  }
}

export const api = new ApiRequest();
