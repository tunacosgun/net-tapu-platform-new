import type { Config } from 'tailwindcss';

/**
 * NetTapu Tailwind Config
 * Palette: Olive Green (#515D2B) + Charcoal (#2C2C28) + White
 * Inspired by sahibinden.com — dense, functional, professional.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Manrope', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* ── Primary brand — Olive Green #515D2B ─── */
        brand: {
          50:  '#f4f6ec',
          100: '#e5eaca',
          200: '#ccd49b',
          300: '#aebb66',
          400: '#8e9d3f',
          500: '#6d7a32',
          600: '#515d2b',   /* primary */
          700: '#414a24',
          800: '#343c1f',
          900: '#2c331c',
          950: '#161a0c',
        },
        emerald: {
          50:  '#f4f6ec',
          100: '#e5eaca',
          200: '#ccd49b',
          300: '#aebb66',
          400: '#8e9d3f',
          500: '#6d7a32',
          600: '#515d2b',
          700: '#414a24',
          800: '#343c1f',
          900: '#2c331c',
          950: '#161a0c',
        },
        /* ── Charcoal (dark panels / logo backdrop) ─ */
        ink: {
          50:  '#f6f6f5',
          100: '#e8e8e6',
          200: '#d1d1cd',
          300: '#a9a9a2',
          400: '#7a7a73',
          500: '#4e4e48',
          600: '#3a3a35',
          700: '#2c2c28',
          800: '#1f1f1c',
          900: '#121210',
        },
        /* ── Gold accent (premium highlights) ─────── */
        gold: {
          50:  '#fbf5ea',
          100: '#f4e4bf',
          200: '#e8d4a8',
          300: '#d6b474',
          400: '#c29a58',
          500: '#b8894d',
          600: '#a07841',
          700: '#8a6436',
          800: '#6f502c',
          900: '#5a4224',
        },
        /* ── Neutral slate-alike (keep Tailwind slate but warmer) ─ */
        slate: {
          50:  '#fafafa',
          100: '#f4f4f4',
          200: '#e6e6e6',
          300: '#d4d4d4',
          400: '#a1a1a1',
          500: '#6b6b6b',
          600: '#525252',
          700: '#3f3f3f',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        auction: {
          live: '#c0392b',
          ending: '#c07a1a',
          scheduled: '#1f4c8a',
          ended: '#6b6b6b',
        },
      },
      backgroundImage: {
        'gradient-olive':   'linear-gradient(135deg, #515d2b 0%, #414a24 60%, #2c331c 100%)',
        'gradient-olive-soft': 'linear-gradient(135deg, #f4f6ec 0%, #e5eaca 100%)',
        'gradient-ink':     'linear-gradient(135deg, #2c2c28 0%, #1f1f1c 100%)',
        'gradient-card':    'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      keyframes: {
        'bid-flash': {
          '0%': { backgroundColor: 'rgb(22 163 74 / 0.3)', transform: 'scale(1.02)' },
          '50%': { backgroundColor: 'rgb(22 163 74 / 0.15)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
        'bid-slide-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'bid-flash': 'bid-flash 1.5s ease-out, bid-slide-in 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'marquee': 'marquee 30s linear infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
      },
      boxShadow: {
        'glow-sm':  '0 0 20px rgba(81,93,43,0.12)',
        'glow-md':  '0 0 40px rgba(81,93,43,0.18)',
        'glow-lg':  '0 0 80px rgba(81,93,43,0.22)',
        'inset-soft': 'inset 0 1px 0 rgba(255,255,255,0.06)',
        'brand':    '0 2px 8px rgba(81,93,43,0.18)',
        'brand-lg': '0 10px 28px rgba(81,93,43,0.26)',
        'glass':    '0 4px 16px rgba(17,17,16,0.08)',
        'premium':  '0 14px 40px rgba(17,17,16,0.12), 0 4px 12px rgba(17,17,16,0.06)',
      },
      borderRadius: {
        'sm': '3px',
        'md': '5px',
        'lg': '8px',
        'xl': '10px',
        '2xl': '14px',
      },
    },
  },
  plugins: [],
};

export default config;
