/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#1a1a1a',
        'charcoal': '#2C3E50',
        'navy': '#1e3a5f',
        'warm-white': '#f5f5f5',
        'accent-gold': '#D89B6A',
        'aqua': '#5B8FA3',
        'light-green': '#7fb069',
        'alert-red': '#e63946',
      },
    },
  },
  plugins: [],
}

