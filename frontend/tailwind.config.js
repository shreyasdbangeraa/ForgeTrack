/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#ff007a',
        'neon-purple': '#9d00ff',
        'neon-blue': '#00d4ff',
        'dark-bg': '#050505',
        'surface': {
          DEFAULT: '#111118',
          raised: '#16161F',
          inset: '#0E0E14',
        },
        fg: {
          primary: '#F5F5F7',
          secondary: '#8A8A94',
          tertiary: '#52525B',
        },
        success: { DEFAULT: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
        danger:  { DEFAULT: '#F43F5E', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)' },
        warning: { DEFAULT: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
        'outfit': ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to right, #ff007a, #9d00ff, #00d4ff)',
        'dark-gradient': 'radial-gradient(circle at top, #1a1a2e 0%, #050505 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
    },
  },
  plugins: [],
}
