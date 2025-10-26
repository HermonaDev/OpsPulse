/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0A0B0A",
        "bg-secondary": "#1A1C1A",
        "text-primary": "#E9E9E9",
        "text-secondary": "#A4A6A6",
        "accent": "#92D30A",
        "accent-hover": "#A8E82C",
      }
    },
  },
  plugins: [],
}

