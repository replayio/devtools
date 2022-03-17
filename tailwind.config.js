module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        short: { raw: "(max-height: 615px)" },
      },
      colors: {
        bodyColor: "var(--theme-body-color)",
        breakpointEditfieldActive: "var(--breakpoint-editfield-active)",
        breakpointEditfieldHover: "var(--breakpoint-editfield-hover)",
        breakpointStatus: "var(--breakpoint-status)",
        breakpointStatusBG: "var(--breakpoint-status-bg)",
        breakpointTip: "var(--breakpoint-tip)",
        breakpointLabel: "var(--breakpoint-label)",
        checkbox: "var(--checkbox)",
        checkboxBorder: "var(--checkbox-border)",
        chrome: "var(--chrome)",
        errorBgcolor: "var(--console-error-background)",
        errorColor: "var(--console-error-color)",
        iconColor: "var(--icon-color)",
        iconColorDisabled: "var(--theme-text-field-bgcolor)",
        jellyfishBgcolor: "var(--jellyfish-bgcolor)",
        menuBgcolor: "var(--menu-bgcolor)",
        menuColor: "var(--menu-color)",
        menuHoverBgcolor: "var(--menu-hover-bgcolor)",
        menuHoverColor: "var(--menu-hover-color)",
        modalBgcolor: "var(--modal-bgcolor)",
        modalBorder: "var(--modal-border)",
        primaryAccent: "var(--primary-accent)",
        primaryAccentHover: "var(--primary-accent-hover)",
        primaryAccentLegacy: "var(--primary-accent-legacy)",
        primaryAccentLegacyHover: "var(--primary-accent-legacy-hover)",
        primaryAccentText: "var(--primary-accent-text)",
        secondaryAccent: "var(--secondary-accent)",
        secondaryAccentHover: "var(--secondary-accent-hover)",
        splitter: "var(--theme-splitter-color)",
        textFieldBorder: "var(--text-field-border)",
        themeBodyBgcolor: "var(--theme-body-bgcolor)",
        themeBorder: "var(--theme-border)",
        themeFocuserBgcolor: "var(--theme-focuser-bgcolor)",
        themeMenuHighlight: "var(--theme-menu-highlight)",
        themeTabBgcolor: "var(--theme-tab-bgcolor)",
        themeTabBgcolorAltSubtle: "var(--theme-tab-bgcolor-alt-subtle)",
        themeTextFieldBgcolor: "var(--theme-text-field-bgcolor)",
        themeTextFieldColor: "var(--theme-text-field-color)",
        themeToggleBgcolor: "var(--theme-toggle-bgcolor)",
        themeToolbarPanelIconColor: "var(--theme-toolbar-panel-icon-color)",
        toolbarBackground: "var(--theme-toolbar-background)",
        toolbarBackgroundAlt: "var(--theme-toolbar-background-alt)",
        lightGrey: "var(--light-grey)",      
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
