import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // espresso base
        ink: {
          DEFAULT: '#0A0A0B',
          800: '#101013',
          700: '#16161B',
          600: '#1E1E25',
          500: '#2A2A33',
        },
        // brand accents (orange / white identity; keys kept for existing class usages)
        brew: {
          green: '#F97316', // primary orange
          amber: '#FB923C', // light orange
          ember: '#EA580C', // deep orange
        },
        long: '#14F195',
        short: '#FF4D5E',
        muted: '#7A7A88',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249,115,22,0.18), 0 0 40px -8px rgba(249,115,22,0.40)',
        ember: '0 0 0 1px rgba(234,88,12,0.18), 0 0 40px -8px rgba(234,88,12,0.40)',
      },
      backgroundImage: {
        'brew-gradient': 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)',
        'grid': 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        rise: 'rise 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
