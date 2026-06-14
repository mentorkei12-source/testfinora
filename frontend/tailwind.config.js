/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', 50: '#EFF6FF', 100: '#DBEAFE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        success: { DEFAULT: '#10B981', 50: '#ECFDF5', 100: '#D1FAE5', 500: '#10B981', 600: '#059669' },
        warning: { DEFAULT: '#F59E0B', 50: '#FFFBEB', 100: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', 50: '#FEF2F2', 100: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        card: '0 1px 3px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};
