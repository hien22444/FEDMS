/* eslint-disable @typescript-eslint/no-explicit-any */

import { ROUTES } from '@/constants';

class ApiRequest {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BASE_URL || '';
  }

  /**
   * Attempt to refresh the access token using the refresh token.
   * Returns true if refresh succeeded, false otherwise.
   */
  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const response = await res.json();
      if (!res.ok || response.success === false) return false;

      const data = response.data;
      if (data.token) localStorage.setItem('token', data.token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(
    url: string,
    config: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Accept-Language': 'en',
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

    let response: { success?: boolean; message?: string | string[]; data?: T };
    try {
      response = await res.json();
    } catch {
      response = { success: false, message: res.statusText || 'An error occurred' };
    }

    const msg = response.message;
    const messageStr = Array.isArray(msg) ? msg.join(', ') : (msg || 'An error occurred');

    if (!res.ok || response.success === false) {
      const error = {
        statusCode: res.status,
        message: messageStr,
      };

      if (res.status === 401 && !isRetry) {
        // Try to refresh the token (deduplicate concurrent refresh attempts)
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          this.refreshPromise = this.tryRefreshToken().finally(() => {
            this.isRefreshing = false;
            this.refreshPromise = null;
          });
        }

        const refreshed = await this.refreshPromise;
        if (refreshed) {
          // Retry the original request with the new token
          return this.request<T>(url, { ...config, headers: {} }, true);
        }

        // Refresh failed — clear tokens and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        if (!window.location.pathname.includes('/signin') &&
            !window.location.pathname.includes('/auth/google/callback') &&
            !window.location.pathname.includes('/admin/login')) {
          window.location.href = ROUTES.SIGN_IN;
        }
        return Promise.reject(error);
      }

      throw error;
    }

    // Handle both formats: { data: T } and { success: true, data: T }
    return (response as { data?: T }).data as T;
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
