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
        primaryAccentLegacy: "var(--primary-accent-legacy)",
        primaryAccentHoverLegacy: "var(--primary-accent-hover-legacy)",
        secondaryAccent: "var(--secondary-accent)",
        textFieldBorder: "var(--text-field-border)",
        toolbarBackground: "var(--theme-toolbar-background)",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
