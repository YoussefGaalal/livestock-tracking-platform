/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#002819',
          secondary: '#06402B',
          accent: '#D4AF37',
          light: '#FAF1F5',
        },
        neutral: {
          50: '#FAF1F5',
          100: '#F4F4EF',
          200: '#E3E3DE',
          300: '#eeeee9',
          400: '#c0c9c1',
          500: '#717973',
          550: '#717473',
          600: '#404943',
          700: '#1a1c19',
        },
        green: {
          50: '#d2e8d9',
          100: '#cfe5d6',
          200: '#b6ccbe',
          600: '#4f6357',
        },
        yellow: {
          600: '#cba72f',
          800: '#735c00',
        },
        red: {
          150: '#dadad5',
          800: '#93000a',
          600: '#d91d39',
        },
        emerald: {
          600: '#1da851',
        },
        role: {
          admin: { bg: '#FEE2E2', text: '#DC2626' },
          owner: { bg: '#FEF3C7', text: '#D97706' },
          manager: { bg: '#EDE9FE', text: '#7C3AED' },
          shepherd: { bg: '#DBEAFE', text: '#2563EB' },
          doctor: { bg: '#D1FAE5', text: '#059669' },
        },
        danger: '#BA1A1A',
        success: '#059669',
        whatsapp: '#25D366',
        rose: {
          600: '#F22F46',
        },
        indigo: {
          400: '#635BFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0px 4px 16px rgba(6, 64, 43, 0.08)',
        'card-hover': '0px 8px 24px rgba(6, 64, 43, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
