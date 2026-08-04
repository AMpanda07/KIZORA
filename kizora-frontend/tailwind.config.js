/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-space': '#0B0C10',
        'neon-purple': '#8B5CF6',
        'neon-blue': '#6366F1',
        'neon-cyan': '#22D3EE',
        space: {
          bg: '#0B0C10',
          card: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          purple: '#A855F7',
          cyan: '#22D3EE'
        }
      },
      boxShadow: {
        'neon-glow': '0 0 25px -5px rgba(139, 92, 246, 0.7), 0 0 50px -10px rgba(99, 102, 241, 0.4)',
        'glow-indigo': '0 0 20px -5px rgba(99, 102, 241, 0.5)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
