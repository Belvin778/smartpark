/** @type {import('tailwindcss').Config} */
module.exports = {
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
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcdfff",
          300: "#8eccff",
          400: "#58b0ff",
          500: "#2f8dff",
          600: "#186eef",
          700: "#1055db",
          800: "#1345b1",
          900: "#153d8c",
          950: "#102655",
        },
      },
    },
  },
  plugins: [],
};
