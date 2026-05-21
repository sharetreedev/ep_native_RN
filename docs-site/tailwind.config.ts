import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pulse brand
        meadow: {
          DEFAULT: '#91A27D',
          dark: '#6f8a55',
          darker: '#5e7548',
          light: '#a8b797',
          lighter: '#c8d2bd',
          tint: 'rgba(145, 162, 125, 0.12)',
        },
        terracotta: '#D08A6E',
        sand: {
          DEFAULT: '#EDE9E4',
          light: '#F5F2EE',
          dark: '#D8D2C8',
        },
        ink: {
          DEFAULT: '#1F2937',
          muted: '#4B5563',
          subtle: '#6B7280',
          ghost: '#9CA3AF',
        },
      },
      fontFamily: {
        heading: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
        body: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
