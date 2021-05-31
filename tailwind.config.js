module.exports = {
  purge: {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    enabled: true,
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
