/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4AF37', // Gold color as primary
          50: '#FBF8EC',
          100: '#F7F1D9',
          200: '#EFE3B4',
          300: '#E7D58F',
          400: '#DFC86A',
          500: '#D4AF37', // Main gold color
          600: '#B08F2A',
          700: '#8B6F21',
          800: '#655018',
          900: '#40300F',
        },
        secondary: {
          DEFAULT: '#1E1E1E', // Dark color for text
          50: '#F7F7F7',
          100: '#EFEFEF',
          200: '#DFDFDF',
          300: '#CFCFCF',
          400: '#5F5F5F',
          500: '#1E1E1E', // Main dark color
          600: '#191919',
          700: '#141414',
          800: '#0F0F0F',
          900: '#0A0A0A',
        },
        accent: {
          DEFAULT: '#6B7280', // Gray for helper texts
        },
        success: {
          DEFAULT: '#22C55E', // Green for success messages
        },
        error: {
          DEFAULT: '#EF4444', // Red for error messages
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        dropdown: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
  plugins: [],
}; 