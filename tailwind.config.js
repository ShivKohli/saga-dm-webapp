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
          bg: "#0B0B0D",          // dark dungeon background
          panel: "#1A1A1E",       // elevated cards
          accent: "#8B5CF6",      // arcane violet
          accentDark: "#5B21B6",  // hover/active accent
          gold: "#D6A354",        // mystical highlight
          text: "#EAE7E0",        // parchment white
          subtext: "#9CA3AF",     // secondary gray
          danger: "#B91C1C",
          success: "#22C55E",
        },
      },
      fontFamily: {
        saga: ["'Cinzel'", "serif"], // for headings
        ui: ["'Inter'", "sans-serif"], // for body
      },
      boxShadow: {
        glow: "0 0 8px rgba(139, 92, 246, 0.4)",
      },
    },
  },
  plugins: [],
};
