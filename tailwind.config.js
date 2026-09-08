/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#598dff',
          500: '#3366ff',
          600: '#1a47f5',
          700: '#1430d8',
          800: '#1629ad',
          900: '#172a89',
          950: '#101a4f',
        },
        risk: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#dc2626',
        },
        // Dark theme surfaces
        surface: {
          0: '#0a0e17',
          1: '#111726',
          2: '#1a2236',
          3: '#232d44',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0,0,0,0.08), 0 4px 16px -4px rgba(0,0,0,0.06)',
        'soft-md': '0 4px 20px -6px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.08)',
        'soft-lg': '0 8px 40px -12px rgba(0,0,0,0.12), 0 16px 56px -16px rgba(0,0,0,0.1)',
        'glow': '0 0 0 1px rgba(51,102,255,0.08), 0 4px 24px -8px rgba(51,102,255,0.3)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'blob-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.15)' },
          '66%': { transform: 'translate(-25px, 35px) scale(0.9)' },
        },
        'blob-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-35px, 40px) scale(1.1)' },
          '66%': { transform: 'translate(30px, -25px) scale(0.95)' },
        },
        'blob-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20px, 20px) scale(1.2)' },
        },
        'liquid-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'blob-1': 'blob-1 20s ease-in-out infinite',
        'blob-2': 'blob-2 25s ease-in-out infinite',
        'blob-3': 'blob-3 18s ease-in-out infinite',
        'liquid-flow': 'liquid-flow 3s linear infinite',
      },
    },
  },
  plugins: [],
};
