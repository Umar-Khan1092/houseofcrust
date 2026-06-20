/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F59E0B',
        secondary: '#94A3B8',
        background: '#FCDCB6',
        card: '#FFF8F0',
        heading: '#1E293B',
        body: '#334155',
      },
      boxShadow: {
        soft: '0 24px 60px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
}
