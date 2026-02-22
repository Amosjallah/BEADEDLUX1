/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        handwriting: ['Pacifico', 'cursive'],
      },
      colors: {
        brand: {
          DEFAULT: '#0ea5e9', // sky-500
          light: '#38bdf8', // sky-400
          dark: '#0369a1', // sky-700
          accent: '#7dd3fc', // sky-300
          muted: '#e0f2fe', // sky-100
        },
      },
    },
  },
  plugins: [],
}

