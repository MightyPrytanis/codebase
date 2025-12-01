/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'arkiver-dark': '#2C3E50',
        'arkiver-accent': '#D89B6A',
        'arkiver-teal': '#5B8FA3',
        'arkiver-bg': '#f5f5f5',
        'arkiver-card': '#ffffff',
        'arkiver-border': '#e0e0e0',
      },
    },
  },
  plugins: [],
}


