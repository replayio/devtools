module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        short: { raw: "(max-height: 615px)" },
      },
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
        chrome: "var(--chrome)",
        themeBodyBackground: "var(--theme-body-background)",
        themeMenuHighlight: "var(--theme-menu-highlight)",
        themeTabBackground: "var(--theme-tab-background)",
        themeTabBackgroundAltSubtle: "var(--theme-tab-background-alt-subtle)",
        iconColor: "var(--icon-color)",
        iconColorDisabled: "var(--theme-text-field)",
        themeBorder: "var(--theme-border)",
        themeTextField: "var(--theme-text-field)",
      },
      lineHeight: {
        "comment-text": "1.125rem",
        2: "10px",
      },
      cursor: {
        "ew-resize": "ew-resize",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
