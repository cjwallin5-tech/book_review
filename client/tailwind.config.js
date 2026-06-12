/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
      },
      boxShadow: {
        book: "0 4px 8px -2px rgba(0,0,0,0.55), -2px 0 6px -2px rgba(0,0,0,0.35)",
        "book-hover":
          "0 20px 40px -8px rgba(0,0,0,0.85), 0 0 24px -8px rgba(59,130,246,0.22), -4px 0 10px -2px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
