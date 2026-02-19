import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#6B8F9E",
          hover: "#5A7D8C",
        },
        secondary: "#A8C5B8",
        "text-primary": "#2D3436",
        "text-secondary": "#636E72",
        "text-muted": "#B2BEC3",
        border: "#DFE6E9",
        success: "#81C995",
        warning: "#F0C674",
        error: "#E07070",
        academic: "#7FAACC",
        career: "#C2A0D0",
        personal: "#F0C674",
      },
      borderRadius: {
        xl: "12px",
      },
      maxWidth: {
        content: "768px",
      },
    },
  },
  plugins: [],
}

export default config
