/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        saga: {
          bg: "#0f0f14",
          card: "#16161d",
          accent: "#8b5cf6",
          text: "#e5e7eb"
        }
      }
    },
  },
  plugins: [],
}
