import defaultTheme from 'tailwindcss/defaultTheme';
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        //frequently
        primary: '#146EF5',
        'primary-lighter': '#E6F0F9',
        'primary-darker': '#4386D9',
        // primary: '#5C98F2',
        'gray-primary': '#696969',
        'gray-surface': '#F5F5F7',
        'yellow-darker': '#FFAE13',
        sematic: '#bac4d7',
        brown: '#FFF8EC',
        'gray-sematic': '#b0bcd1',
        'black-lighter': '#535e70',
        'sub-primary': '#a3afc8',
        //
        'blue-darker': '#4967D2',
        'gray-default': '#E4E3E3',
        'gray-subtle': '#F9F9F9',
        'gray-sub-title': '#635B5B',
        'gray-lighter': '#a9b6cd',
        'black-darker': '#201515',
        'green-default': '#3C4235',
        secondary: '#8B8B8B',
      },
      fontFamily: {
        sans: ['InterTight-Regular', 'sans-serif'],
        display: [
          ['InterTight-Regular', ...defaultTheme.fontFamily.sans],
          { fontVariationSettings: '"wdth" 125' },
        ],
        medium: ['InterTight-Medium', 'sans-serif'],
        semibold: ['InterTight-SemiBold', 'sans-serif'],
        bold: ['InterTight-Bold', 'sans-serif'],
        extrabold: ['InterTight-ExtraBold', 'sans-serif'],
        poppins: ['Poppins-Bold', 'sans-serif'],
      },
      maxWidth: {
        heading: '1360px',
        layout: '1280px',
      },
      borderRadius: {
        smd: '4px',
      },
      typography: {
        DEFAULT: {
          css: {
            h1: { fontSize: '2.25rem', fontWeight: '700' },
            h2: { fontSize: '1.875rem', fontWeight: '600' },
            h3: { fontSize: '1.5rem' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
