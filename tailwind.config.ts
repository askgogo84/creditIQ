import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'var(--font-geist)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        syne: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d6dfeb',
          200: '#a8bcd3',
          300: '#7a98bb',
          400: '#4d76a4',
          500: '#2f5783',
          600: '#1B3A5C',
          700: '#15314e',
          800: '#0f2540',
          900: '#0a1a2e',
          950: '#06111f',
        },
        gold: {
          50: '#fbf6e7',
          100: '#f6ebc5',
          200: '#ecd690',
          300: '#e0bd5b',
          400: '#d5a73f',
          500: '#C9972E',
          600: '#a87a23',
          700: '#855e1c',
          800: '#5e4314',
          900: '#3d2c0e',
        },
        ink: {
          50: '#f5f5f6',
          100: '#e7e7e9',
          200: '#c4c4c8',
          300: '#9b9ba2',
          400: '#6f6f78',
          500: '#4d4d55',
          600: '#34343a',
          700: '#23232a',
          800: '#161619',
          900: '#0e0e11',
          950: '#0a0a0b',
        },
        copper: {
          50: '#fbf5ee',
          100: '#f5e6d3',
          200: '#ebcfae',
          300: '#deb083',
          400: '#d4a373',
          500: '#c08a52',
          600: '#a26f41',
          700: '#825839',
          800: '#6b4831',
          900: '#5a3d2c',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        crimson: {
          400: '#fb7185',
          500: '#e11d48',
          600: '#be123c',
        },
      },
      animation: {
        'ticker': 'ticker 60s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
