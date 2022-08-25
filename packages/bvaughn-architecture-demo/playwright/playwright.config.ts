const { CI, RECORD_VIDEO, VISUAL_DEBUG } = process.env;

let slowMo = 50;
if (CI || VISUAL_DEBUG) {
  slowMo = 500;
}

const config = {
  forbidOnly: !!CI,
  reporter: CI ? "github" : "list",
  retries: 5,
  snapshotDir: "./snapshots",
  use: {
    browserName: "chromium",
    launchOptions: {
      slowMo,
    },
    trace: "on-first-retry",
    video: RECORD_VIDEO ? "on" : "off",
    viewport: {
      width: 1024,
      height: 600,
    },
  },
  testDir: __dirname,
  testMatch: ["tests/**/*.ts"],
  timeout: 5000,
};

if (VISUAL_DEBUG) {
  // @ts-ignore
  config.workers = 1;
}

export default config;
