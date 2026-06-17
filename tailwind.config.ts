import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base":          "#0b0f1a",
        "bg-panel":         "#111827",
        "bg-card":          "#141e2e",
        "border-panel":     "#1e2a3a",
        "accent-blue":      "#0ea5e9",
        "accent-blue-dark": "#1d4ed8",
        "accent-purple":    "#a855f7",
        "accent-pink":      "#ec4899",
        "accent-cyan":      "#22d3ee",
        "status-ok":        "#22c55e",
        "status-error":     "#ef4444",
        "status-warn":      "#f59e0b",
        "text-primary":     "#e2e8f0",
        "text-muted":       "#64748b",
        "topbar":           "#0c1220",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
