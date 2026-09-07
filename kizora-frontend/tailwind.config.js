/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kz-bg':      '#080A0F',   
        'kz-surface': '#0D1017',   
        'kz-card':    '#121620',   
        'kz-border':  '#1C2130',   
        'kz-primary': '#3B82F6',   // Solid blue
        'kz-secondary': '#10B981', // Solid emerald
        'kz-danger':  '#EF4444',   
        'kz-text':    '#F8FAFC',   
        'kz-muted':   '#94A3B8',   
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
