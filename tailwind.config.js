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
          // Main brand tones
          accent: "#8B5CF6", // vivid arcane purple
          accentDark: "#5B21B6", // deeper version for hover/active
          gold: "#D6A354", // mystical ember highlight
          bg: "#0B0B0D", // near-black background
          panel: "#1A1A1E", // card/panel background
          text: "#EAE7E0", // light parchment text
          subtext: "#9CA3AF", // secondary text
          danger: "#B91C1C", // for errors
          success: "#22C55E", // for success states
        },
      },
      fontFamily: {
        saga: ["'Cinzel'", "serif"], // medieval serif headline font (optional)
        ui: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 10px rgba(139, 92, 246, 0.4)", // subtle magical glow
      },
    },
  },
  plugins: [],
};
