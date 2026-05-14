/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6b21a8",
        secondary: "#3b0764",
        accent: "#a855f7",
        dark: "#0f172a",
      },
      animation: {
        pulse: "pulse-glow 3s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
