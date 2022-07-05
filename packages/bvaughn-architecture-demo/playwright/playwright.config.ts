// playwright.config.ts

const config = {
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  use: {
    browserName: "chromium",
    launchOptions: {
      // Useful for visual debugging
      slowMo: 1000,
    },
    trace: "on-first-retry",
    video: process.env.RECORD_VIDEO ? "on" : "off",
    viewport: {
      width: 1024,
      height: 600,
    },
  },
  snapshotDir: "./snapshots",
  testDir: __dirname,
  testMatch: ["tests/**/*.ts"],
};

export default config;
