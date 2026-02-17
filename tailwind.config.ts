import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#f59e0b',
        accent: '#ec4899',
        success: '#10b981',
        error: '#ef4444',
        moon: {
          accent: '#94a3b8',
        },
        mars: {
          accent: '#f97316',
        },
        space: {
          accent: '#a855f7',
        },
      },
      backgroundImage: {
        'moon-gradient': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'mars-gradient': 'linear-gradient(135deg, #451a03 0%, #1e1b4b 100%)',
        'space-gradient': 'linear-gradient(135deg, #2e1065 0%, #020617 100%)',
        'cosmic-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      },
      borderRadius: {
        'md': '1rem',
        'lg': '1.5rem',
      },
      boxShadow: {
        'glass': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'pop-in': 'pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
