import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#146EF5',
    fontSize: 14,
    fontFamily: 'InterTight-Regular',
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
