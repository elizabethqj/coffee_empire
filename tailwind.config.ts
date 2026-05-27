import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          primary:   'rgb(var(--surface-primary)   / <alpha-value>)',
          secondary: 'rgb(var(--surface-secondary) / <alpha-value>)',
          card:      'rgb(var(--surface-card)      / <alpha-value>)',
          elevated:  'rgb(var(--surface-elevated)  / <alpha-value>)',
        },
        accent: {
          primary:   'rgb(var(--accent-primary)   / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          success:   'rgb(var(--accent-success)   / <alpha-value>)',
        },
        status: {
          ok:      'rgb(var(--status-ok)      / <alpha-value>)',
          success: 'rgb(var(--status-success) / <alpha-value>)',
          warn:    'rgb(var(--status-warn)    / <alpha-value>)',
          error:   'rgb(var(--status-error)   / <alpha-value>)',
        },
        text: {
          primary:   'rgb(var(--text-primary)   / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted:     'rgb(var(--text-muted)     / <alpha-value>)',
        },
        border: {
          default: 'rgb(var(--border-default) / <alpha-value>)',
          strong:  'rgb(var(--border-strong)  / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow': 'flow 1.5s linear infinite',
      },
      keyframes: {
        flow: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
