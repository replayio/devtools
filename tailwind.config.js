module.exports = {
  purge: {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        lightGrey: "var(--light-grey)",
        primaryAccent: "var(--primary-accent)",
        primaryAccentText: "var(--primary-accent-text)",
        primaryAccentHover: "var(--primary-accent-hover)",
        primaryAccentLegacyHover: "var(--primary-accent-legacy-hover)",
        primaryAccentLegacy: "var(--primary-accent-legacy)",
        secondaryAccent: "var(--secondary-accent)",
        secondaryAccentHover: "var(--secondary-accent-hover)",
        textFieldBorder: "var(--text-field-border)",
        toolbarBackground: "var(--theme-toolbar-background)",
        bodyColor: "var(--theme-body-color)",
        jellyfish: "rgba(255,255,255,0.8)",
        splitter: "var(--theme-splitter-color)",
      },
      lineHeight: {
        "comment-text": "1.125rem",
      },
      cursor: {
        "ew-resize": "ew-resize",
      },
    },
  },
  variants: {
    width: ["hover", "group-hover"],
  },
  plugins: [require("@tailwindcss/forms")],
};
