/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        platform: {
          dark: '#050B14',
          panel: '#0B1423',
          card: '#111D31',
          cyan: '#00F0FF',
          violet: '#7B2CBF',
          success: '#00FFA3',
          warning: '#FFB800',
          danger: '#FF3366',
          border: 'rgba(0, 240, 255, 0.15)'
        }
      }
    },
  },
  plugins: [],
}
