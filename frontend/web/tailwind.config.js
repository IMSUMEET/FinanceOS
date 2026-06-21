/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#080f1e",
        },
        category: {
          food: "#f97316",
          groceries: "#22c55e",
          gas: "#eab308",
          transport: "#06b6d4",
          shopping: "#3b82f6",
          entertainment: "#ec4899",
          travel: "#8b5cf6",
          utilities: "#14b8a6",
          subscriptions: "#6366f1",
          other: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 38px rgba(15,23,42,0.04)",
        softLg: "0 20px 40px rgba(15,23,42,0.06)",
        brand: "0 10px 24px rgba(13,148,136,0.25)",
        ring: "0 0 0 4px rgba(20,184,166,0.15)",
        dark: "0 20px 40px rgba(15,23,42,0.18)",
        softDark: "0 18px 38px rgba(0,0,0,0.45)",
        softLgDark: "0 24px 48px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        xl2: "28px",
        xl3: "32px",
      },
      backgroundImage: {
        appField:
          "radial-gradient(circle at top left, rgba(20,184,166,0.08), transparent 25%), radial-gradient(circle at top right, rgba(245,158,11,0.06), transparent 25%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)",
        appFieldDark:
          "radial-gradient(circle at top left, rgba(13,148,136,0.1), transparent 30%), radial-gradient(circle at top right, rgba(245,158,11,0.04), transparent 30%), linear-gradient(180deg, #0b0f19 0%, #0d1222 50%, #0b0f19 100%)",
        brand: "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
        brandSoft: "linear-gradient(135deg, #14b8a6 0%, #34d399 100%)",
        insight: "linear-gradient(135deg, #0b0f19 0%, #1e293b 100%)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 240ms ease-out both",
      },
    },
  },
  plugins: [],
};
