/* eslint-disable */

import { ROUTES } from '@/constants';

class ApiRequest {
  constructor() {
    this.baseUrl = import.meta.env.VITE_BASE_URL || '';
  }

  async request(url, config = {}) {
    const headers = {
      Accept: 'application/json',
      'Accept-Language': 'en',
      ...(config.headers || {}),
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

    const response = await res.json();
    return response.data;
  }

  async get(url, config = {}) {
    return this.request(url, { ...config, method: 'GET' });
  }

  async post(url, body, config = {}) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body,
    });
  }

  async put(url, body, config = {}) {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body,
    });
  }

  async delete(url, config = {}) {
    return this.request(url, { ...config, method: 'DELETE' });
  }
}

export const api = new ApiRequest();
