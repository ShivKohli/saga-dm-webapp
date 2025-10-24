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
          bg: "#0B0B0D",          // backdrop (keep dark around the parchment)
          panel: "#1A1A1E",       // card/panel bg
          parchment: "#F5ECD6",   // 🪶 parchment background for messages
          parchmentDark: "#E9DFC0", // alternate tone for variety
          ink: "#2B2118",         // deep brown-black for text
          accent: "#8B5CF6",      // keep your arcane purple accent
          gold: "#C49A3E",        // decorative trim
          subtext: "#9C8E72",     // muted brown-gray
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
