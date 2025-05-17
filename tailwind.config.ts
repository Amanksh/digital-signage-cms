import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: "#3B82F6", // Vibrant blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#10B981", // Fresh green
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#8B5CF6", // Soft purple
          foreground: "#FFFFFF",
        },
        // Background Colors
        background: {
          DEFAULT: "#F8F9FA", // Canvas area
          panel: "#F1F5F9", // Sidebars and panels
          interface: "#FFFFFF", // Main UI areas
        },
        // Border Colors
        border: {
          DEFAULT: "#E2E8F0", // Subtle gray
          grid: {
            regular: "#E5E7EB",
            major: "#CBD5E1",
          },
        },
        // Text Colors
        text: {
          primary: "#1E293B", // Dark slate
          secondary: "#64748B", // Medium gray
          disabled: "#94A3B8", // Light gray
        },
        // Status Colors
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        error: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#0EA5E9",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
