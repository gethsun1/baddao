import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        baddao: {
          primary: "#0B1220",
          secondary: "#141B2D",
          accent: "#2F6BFF",
          highlight: "#4FD1FF",
          border: "#1E2638",
          card: "#121826",
          primaryAccent: "#FF3C00" // Brand Accent
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-space-grotesk)'],
        mono: ['var(--font-jetbrains-mono)'],
      }
    },
  },
  plugins: [],
};
export default config;
