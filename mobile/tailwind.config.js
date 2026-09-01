/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f19",
        surface: "#141a2a",
        surface2: "#1c2438",
        border: "#2a3450",
        primary: "#3b82f6",
        primaryDark: "#2563eb",
        muted: "#8b93a7",
        text: "#e6e8ee",
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
