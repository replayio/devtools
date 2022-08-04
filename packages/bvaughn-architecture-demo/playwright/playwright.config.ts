const config = {
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  retries: 3,
  snapshotDir: "./snapshots",
  use: {
    browserName: "chromium",
    launchOptions: {
      // Useful for visual debugging
      slowMo: 500,
    },
    trace: "on-first-retry",
    video: process.env.RECORD_VIDEO ? "on" : "off",
    viewport: {
      width: 1024,
      height: 600,
    },
  },
  testDir: __dirname,
  testMatch: ["tests/**/*.ts"],
};

if (process.env.VISUAL_DEBUG) {
  // @ts-ignore
  config.workers = 1;
}

export default config;
