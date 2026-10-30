/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- THIS IS REQUIRED FOR THE BUTTON TO WORK
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F4B',
          dark: '#07152F',
          light: '#193866',
        },
        gold: {
          DEFAULT: '#D9A55E',
          light: '#F2D58A',
          dark: '#B78319',
        }
      }
    },
  },
  plugins: [],
}