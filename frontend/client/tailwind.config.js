/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "white-side": "#f0d9b5",
        "black-side": "#b8876c",
        "primary-text": "#2c2c2c",
      }
    },
  },
  plugins: [],
}
