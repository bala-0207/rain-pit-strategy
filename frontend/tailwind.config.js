/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        racing: {
          red: '#DC0000',
          dark: '#15151E',
          gray: '#38383F',
          light: '#E8E8E8',
          accent: '#00D9FF'
        }
      },
      fontFamily: {
        formula: ['Formula1', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
