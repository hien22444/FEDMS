export const localStorages = {
  getDeviceId: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('device_id') || '';
    }
    return '';
  },
  getRefreshToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh-token') || '';
    }
    return '';
  },
  getTheme: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-token') || '';
    }
    return '';
  },
  removeRefreshToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh-token');
    }
  },
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-token');
    }
  },
  setDeviceId: (id) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('device_id', id);
    }
  },
  setRefreshToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh-token', token);
    }
  },
  setTheme: (color) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', color);
    }
  },
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-token', token);
    }
  },
};
