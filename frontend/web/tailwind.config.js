/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
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
        soft: "0 18px 38px rgba(59,130,246,0.07)",
        softLg: "0 20px 40px rgba(37,99,235,0.08)",
        brand: "0 10px 24px rgba(79,70,229,0.32)",
        ring: "0 0 0 4px rgba(59,130,246,0.12)",
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
          "radial-gradient(circle at top left, rgba(96,165,250,0.18), transparent 22%), radial-gradient(circle at top right, rgba(167,139,250,0.14), transparent 24%), linear-gradient(180deg, #edf4ff 0%, #f6f9ff 40%, #eef6ff 100%)",
        appFieldDark:
          "radial-gradient(circle at top left, rgba(37,99,235,0.18), transparent 28%), radial-gradient(circle at top right, rgba(124,58,237,0.16), transparent 28%), linear-gradient(180deg, #080f1e 0%, #0b1426 50%, #08101f 100%)",
        brand: "linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)",
        brandSoft: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
        insight: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
