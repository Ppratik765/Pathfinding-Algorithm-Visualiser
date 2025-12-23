/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        visited: '#3b82f6',
        path: '#fbbf24',
        wall: '#1f2937',
        weight: '#78350f', // Amber-900 (Mud)
        'dark-bg': '#0f172a',
        'dark-panel': '#1e293b',
      },
      animation: {
        'pop': 'pop 0.3s ease-out forwards',
        'path': 'grow 0.5s ease-out forwards',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.3)', borderRadius: '50%' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', borderRadius: '0' },
        },
        grow: {
          '0%': { transform: 'scale(0.6)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
