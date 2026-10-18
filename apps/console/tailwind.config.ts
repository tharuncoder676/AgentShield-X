import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        line: "var(--line)",
        fg: "var(--fg)",
        mut: "var(--mut)",
        ok: "var(--ok)",
        bad: "var(--bad)",
        warn: "var(--warn)",
      },
      fontFamily: {
        chakra: ["'Chakra Petch'", "system-ui", "sans-serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "monospace",
        ],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        hairline: "0 0 0 1px var(--line)",
        glow: "0 0 16px -4px var(--ok)",
        "glow-bad": "0 0 16px -4px var(--bad)",
        "glow-warn": "0 0 16px -4px var(--warn)",
      },
    },
  },
  plugins: [],
};

export default config;
