export const localStorages = {
  getDeviceId: (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('device_id') || '';
    }

    return '';
  },
  getRefreshToken: (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh-token') || '';
    }

    return '';
  },
  getTheme: (): string => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('theme') || 'light';
    }

    return 'light';
  },
  getToken: (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-token') || '';
    }

    return '';
  },
  removeRefreshToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh-token');
    }
  },
  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-token');
    }
  },
  setDeviceId: (id: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('device_id', id);
    }
  },
  setRefreshToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh-token', token);
    }
  },
  setTheme: (color: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', color);
    }
  },
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-token', token);
    }
  },
};
