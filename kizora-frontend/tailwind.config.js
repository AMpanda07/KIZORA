/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#09090b',
          card: '#121216',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#06b6d4',
          neon: '#22d3ee',
          purple: '#a855f7',
        }
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(34, 211, 238, 0.4)',
        'glow-lg': '0 0 35px -5px rgba(34, 211, 238, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
