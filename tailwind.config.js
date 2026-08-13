/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0F2A44',
          primary: '#0F2A44',
          secondary: '#2F80ED',
          hover: '#163a5d',
          50: '#f0f5fa',
          100: '#e1ebf5',
          200: '#bcd3eb',
          300: '#8bb3db',
          400: '#5a90c5',
          500: '#3873ac',
          600: '#285b8c',
          700: '#1F3A5F',
          800: '#1d3452',
          900: '#1b2d45',
        },
        base: {
          bg: '#F4F6F8',
          card: '#FFFFFF',
          text: '#1F2933',
          subtext: '#6B7280',
        },
        accent: {
          success: '#27AE60',
          warning: '#F2994A',
          error: '#EB5757',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        'bounce-short': 'bounce-short 0.5s ease-in-out 1',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-short': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
