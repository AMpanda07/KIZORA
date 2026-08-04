/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Animfanz deep space palette
        'af-bg':      '#0F0A1E',   // deepest dark purple bg
        'af-surface': '#1A1030',   // card / panel surface
        'af-card':    '#221540',   // elevated card
        'af-border':  '#2D1F50',   // subtle borders
        'af-purple':  '#7C3AED',   // primary purple
        'af-violet':  '#8B5CF6',   // lighter violet
        'af-pink':    '#C026D3',   // neon pink accent
        'af-cyan':    '#06B6D4',   // cyan accent
        'af-gold':    '#F59E0B',   // star / rating gold
        'af-text':    '#E2D9F3',   // primary text
        'af-muted':   '#7B6EA8',   // muted text

        // legacy tokens kept for compatibility
        'deep-space': '#0F0A1E',
        'neon-purple': '#8B5CF6',
        'neon-blue':  '#6366F1',
        'neon-cyan':  '#22D3EE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'af-radial': 'radial-gradient(ellipse 120% 80% at 50% -10%, #3b0d6e 0%, #0F0A1E 60%)',
        'af-hero':   'radial-gradient(ellipse 80% 90% at 60% 40%, #4c1d95 0%, #0F0A1E 70%)',
      },
      boxShadow: {
        'neon-purple': '0 0 30px -5px rgba(124,58,237,0.7)',
        'neon-glow':   '0 0 40px -8px rgba(139,92,246,0.6)',
        'card-glow':   '0 8px 40px rgba(0,0,0,0.6)',
        'glass':       '0 4px 24px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease-out',
        'fade-in':   'fadeIn 0.4s ease-out',
        'shimmer':   'shimmer 1.6s linear infinite',
        'float':     'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
