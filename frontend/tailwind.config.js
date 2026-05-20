/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#ffffff',
          panel: '#ffffff',
          tile: '#f8fafc',
        },
        line: '#e5e7eb',
        text: {
          primary: '#0f172a',
          muted: '#64748b',
        },
        brand: {
          DEFAULT: '#00ae42',
          soft: '#00ae4214',
        },
        state: {
          running: '#00ae42',
          pause: '#d97706',
          finish: '#2563eb',
          fail: '#dc2626',
          idle: '#94a3b8',
        },
        spaghetti: '#c026d3',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
