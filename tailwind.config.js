module.exports = {
  purge: {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primaryAccent: "var(--primary-accent)",
        primaryAccentHover: "var(--primary-accent-hover)",
        secondaryAccent: "var(--secondary-accent)",
        textFieldBorder: "var(--text-field-border)",
        toolbarBackground: "var(--theme-toolbar-background)",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
