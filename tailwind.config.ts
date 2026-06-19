import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base":          "var(--bg-base)",
        "bg-panel":         "var(--bg-panel)",
        "bg-card":          "var(--bg-card)",
        "border-panel":     "var(--border-panel)",
        "accent-blue":      "var(--accent-blue)",
        "accent-blue-dark": "var(--accent-blue-dark)",
        "accent-purple":    "var(--accent-purple)",
        "accent-pink":      "var(--accent-pink)",
        "accent-cyan":      "var(--accent-cyan)",
        "status-ok":        "var(--status-ok)",
        "status-error":     "var(--status-error)",
        "status-warn":      "var(--status-warn)",
        "text-primary":     "var(--text-primary)",
        "text-muted":       "var(--text-muted)",
        "topbar":           "var(--topbar)",
        "bg-input":         "var(--bg-input)",
        "bg-banner":        "var(--bg-banner)",
        "bg-highlight":     "var(--bg-highlight)",
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
