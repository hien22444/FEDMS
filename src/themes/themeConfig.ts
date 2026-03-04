import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#FF6C00',    // FPT Orange (official brand color)
    colorSuccess: '#00CC66',
    colorWarning: '#FBBF24',
    colorError: '#DC2626',
    colorInfo: '#3B82F6',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
  },
  components: {
    Button: {
      defaultHoverBg: 'auto',
      defaultHoverColor: 'auto',
    },
    Form: {},
  },
};

export default theme;
