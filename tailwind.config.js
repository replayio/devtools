module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        short: { raw: "(max-height: 615px)" },
      },
      colors: {
        themeBase: {
          100: "var(--theme-base-100)",
          95: "var(--theme-base-95)",
          90: "var(--theme-base-90)",
          85: "var(--theme-base-85)",
          80: "var(--theme-base-80)",
          70: "var(--theme-base-70)",
          60: "var(--theme-base-60)",
        },
        bodyColor: "var(--body-color)",
        buttontextColor: "var(--buttontext-color)",
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
        progressbarPreviewMax: "var(--progressbar-preview-max)",
        progressbarPreviewMin: "var(--progressbar-preview-min)",
        secondaryAccent: "var(--secondary-accent)",
        secondaryAccentHover: "var(--secondary-accent-hover)",
        splitter: "var(--theme-splitter-color)",
        textFieldBorder: "var(--text-field-border)",
        bodyBgcolor: "var(--body-bgcolor)",
        testsuitesErrorBgcolor: "var(--testsuites-error-bgcolor)",
        testsuitesErrorColor: "var(--testsuites-error-color)",
        testsuitesStepsBgcolor: "var(--testsuites-steps-bgcolor)",
        themeBorder: "var(--theme-border)",
        themeFocuserBgcolor: "var(--theme-focuser-bgcolor)",
        themeMenuHighlight: "var(--theme-menu-highlight)",
        tabBgcolor: "var(--tab-bgcolor)",
        tabBgcolorAltSubtle: "var(--tab-bgcolor-alt-subtle)",
        themeTextFieldBgcolor: "var(--theme-text-field-bgcolor)",
        themeTextFieldColor: "var(--theme-text-field-color)",
        themeToggleBgcolor: "var(--theme-toggle-bgcolor)",
        themeToggleColor: "var(--theme-toggle-color)",
        themeToolbarPanelIconColor: "var(--theme-toolbar-panel-icon-color)",
        timejumpText: "var(--timejump-text)",
        toolbarBackground: "var(--theme-toolbar-background)",
        toolbarBackgroundAlt: "var(--theme-toolbar-background-alt)",
        tooltipBgcolor: "var(--tooltip-bgcolor)",
        tooltipColor: "var(--tooltip-color)",
        lightGrey: "var(--light-grey)",
        loadingBackground: "var(--loading-background)",
        loadingBoxes: "var(--loading-boxes)",
      },
      lineHeight: {
        "comment-text": "1.125rem",
        2: "10px",
      },
      cursor: {
        "ew-resize": "ew-resize",
      },
      borderWidth: {
        3: "2.5px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
