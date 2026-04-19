import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        group: {
          A: '#6366f1',
          B: '#f59e0b',
          C: '#10b981',
          D: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
export default config
