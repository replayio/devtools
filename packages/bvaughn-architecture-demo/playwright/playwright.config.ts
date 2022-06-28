// playwright.config.ts

const config = {
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  use: {
    browserName: "chromium",
    launchOptions: {
      // Useful for visual debugging
      slowMo: 250,
    },
    trace: "on-first-retry",
    viewport: {
      width: 800,
      height: 400,
    },
  },
  snapshotDir: "./snapshots",
  testDir: __dirname,
  testMatch: ["tests/**/*.ts"],
};

export default config;
