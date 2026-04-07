import type { ThemeConfig } from 'antd';
import { brandPalette } from './brandPalette';

const theme: ThemeConfig = {
  token: {
    colorPrimary: brandPalette.primary,
    colorSuccess: '#00CC66',
    colorWarning: brandPalette.warning,
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
