/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        "bg-2": "#050505",
        surface: "#0B0B0D",
        surface2: "#111114",
        border: "rgba(255, 255, 255, 0.08)",
        "text-primary": "#F5F5F7",
        "text-secondary": "#8A8A93",
        accent: "#22D3EE",
        heat: "#FF5A36",
        rain: "#3B82F6",
        cyclone: "#A78BFA",
      },
      fontFamily: {
        display: ["Space Grotesk", "Segoe UI", "SF Pro Display", "Roboto", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
