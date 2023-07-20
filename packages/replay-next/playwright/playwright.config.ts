import { FullConfig } from "@playwright/test";
import { devices } from "@replayio/playwright";

const { CI, RECORD_VIDEO, SLOW_MO, VISUAL_DEBUG } = process.env;

let slowMo = 10;
if (SLOW_MO) {
  slowMo = parseInt(SLOW_MO, 10);
} else if (VISUAL_DEBUG) {
  slowMo = 250;
}

const config: FullConfig = {
  forbidOnly: !!CI,
  globalSetup: require.resolve("./playwright.globalSetup"),
  // @ts-ignore
  reporter: CI ? "github" : "list",
  retries: RECORD_VIDEO || VISUAL_DEBUG ? 0 : 5,
  snapshotDir: "./snapshots",
  use: {
    // Don't allow any one action to take more than 15s
    actionTimeout: 15_000,
    browserName: "chromium",
    launchOptions: {
      slowMo,
    },

    viewport: {
      width: 1024,
      height: 600,
    },
  },
  testDir: __dirname,
  testMatch: ["tests/**/*.ts"],
  testIgnore: ["tests/**/beforeEach.ts", "tests/**/shared.ts", "tests/utils/*"],

  // Give individual tests a while to complete instead of default 30s
  timeout: 120_000,
};

if (CI) {
  // @ts-ignore
  config.use.launchOptions = {
    ...devices["Replay Chromium"].launchOptions,
    slowMo,
  };
}

if (VISUAL_DEBUG) {
  config.workers = 1;
}

export default config;
