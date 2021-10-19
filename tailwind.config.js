module.exports = {
  purge: {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        faintGrey: "var(--faint-grey)",
        lightGrey: "var(--light-grey)",
        primaryAccent: "var(--primary-accent)",
        primaryAccentHover: "var(--primary-accent-hover)",
        primaryAccentHoverLegacy: "var(--primary-accent-hover-legacy)",
        primaryAccentLegacy: "var(--primary-accent-legacy)",
        secondaryAccent: "var(--secondary-accent)",
        textFieldBorder: "var(--text-field-border)",
        toolbarBackground: "var(--theme-toolbar-background)",
      },
      lineHeight: {
        "comment-text": "1.125rem",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/forms")],
};
