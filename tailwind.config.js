/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'shimmer': 'shimmer 2.5s infinite',
        'drift': 'drift 15s ease-in-out infinite',
        'ping': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) translateY(-100%) skewX(-12deg)' },
          '100%': { transform: 'translateX(200%) translateY(200%) skewX(-12deg)' }
        },
        drift: {
          '0%, 100%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateX(15px) translateY(-10px) rotate(5deg)' },
          '66%': { transform: 'translateX(-10px) translateY(15px) rotate(-5deg)' }
        },
        ping: {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0'
          }
        }
      }
    },
  },
  plugins: [],
} 