import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'cq-primary': '#0EA5E9',
        'cq-primary-dark': '#0284C7',
        'cq-accent': '#10B981',
        'cq-warning': '#F59E0B',
        'cq-danger': '#EF4444',
        'cq-surface': '#F8FAFC',
        'cq-text': '#0F172A',
        'cq-muted': '#64748B',
        'cq-border': '#E2E8F0',
      },
      fontFamily: {
        cq: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
