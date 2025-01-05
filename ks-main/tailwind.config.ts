import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "sm": "100%",
        "md": "100%",
        "lg": "1200px",
        "xl": "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#1a1a1a",
        input: "#0d0d0d",
        ring: "#1a1a1a",
        background: "#000000",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1a1a1a",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        muted: {
          DEFAULT: "#1a1a1a",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#0d0d0d",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#0a0a0a",
          foreground: "#FFFFFF",
        },
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'particle-float': {
          '0%, 100%': {
            transform: 'translate(0, 0) rotate(0)',
            opacity: '0.4',
          },
          '25%': {
            transform: 'translate(10px, -10px) rotate(90deg)',
            opacity: '0.8',
          },
          '50%': {
            transform: 'translate(0, -20px) rotate(180deg)',
            opacity: '0.4',
          },
          '75%': {
            transform: 'translate(-10px, -10px) rotate(270deg)',
            opacity: '0.8',
          },
        },
        glow: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        scale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'particle-float': 'particle-float 12s ease-in-out infinite',
        'glow': 'glow 4s linear infinite',
        'scale': 'scale 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 0deg, transparent 0%, rgba(255, 255, 255, 0.1) 25%, transparent 50%)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
  ],
} satisfies Config;