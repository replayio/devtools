module.exports = {
  purge: {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    enabled: true,
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primaryAccent: "var(--primary-accent)",
        primaryAccentHover: "var(--primary-accent-hover)",
        secondaryAccent: "var(--secondary-accent)",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
