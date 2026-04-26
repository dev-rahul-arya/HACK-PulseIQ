/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#1C1C1E',
        elevated: '#2C2C2E',
        textPrimary: '#FFFFFF',
        textSecondary: '#EBEBF5',
        accent: {
          sleep: '#5E5CE6',
          activity: '#FF9F0A',
          heart: '#FF375F',
          recovery: '#30D158',
          mental: '#64D2FF',
        },
        success: '#30D158',
        warning: '#FFD60A',
        danger: '#FF453A',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(255,255,255,0.06)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
