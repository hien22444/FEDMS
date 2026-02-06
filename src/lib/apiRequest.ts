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
    const headers: HeadersInit = {
      Accept: 'application/json',
      'Accept-Language': 'en',
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
      credentials: 'include',
    });

    if (!res.ok) {
      const text = await res.text();
      const error = JSON.parse(text);

      if (error.statusCode === 401) {
        window.location.href = ROUTES.SIGN_IN;

        return Promise.reject(error);
      }

      throw error;
    }

    const response: { statusCode: number; data: T } =
      await res.json();

    return response.data;
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
}

export const api = new ApiRequest();
