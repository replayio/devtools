import { PlaywrightTestConfig } from "@playwright/test";

const { CI, RECORD_PROTOCOL_DATA, RECORD_VIDEO, SLOW_MO, VISUAL_DEBUG } = process.env;

let slowMo = 10;
if (SLOW_MO) {
  slowMo = parseInt(SLOW_MO, 10);
} else if (VISUAL_DEBUG) {
  slowMo = 250;
} else if (RECORD_PROTOCOL_DATA) {
  slowMo = 100;
}

const config: PlaywrightTestConfig = {
  forbidOnly: !!CI,
  // @ts-ignore
  reporter: CI ? "github" : "list",
  retries: RECORD_VIDEO || VISUAL_DEBUG ? 0 : 2,
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
  timeout: 30_000,
};

if (VISUAL_DEBUG || RECORD_PROTOCOL_DATA) {
  config.workers = 1;
}

export default config;
