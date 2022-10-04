import { PlaywrightTestConfig, devices } from "@playwright/test";
import { devices as replayDevices } from "@replayio/playwright";

const { CI, DEBUG, SLOW_MO } = process.env;

const config: PlaywrightTestConfig = {
  use: {
    headless: !DEBUG,
    launchOptions: {
      slowMo: SLOW_MO ? parseInt(SLOW_MO, 10) : 0,
    },
    viewport: {
      width: 1280,
      height: 1024,
    },
    // Don't allow any one action to take more than 10s
    actionTimeout: 15000,
  },

  // Retry failed tests on CI to account for some basic flakiness.
  retries: CI ? 5 : 0,

  // Give individual tests up to 60s to complete instead of default 30s
  timeout: 60000,

  // Limit the number of workers on CI, use default locally
  workers: CI ? 4 : undefined,
  projects: CI
    ? [
        // {
        //   name: "replay-firefox",
        //   use: { ...(replayDevices["Replay Firefox"] as any) },
        // },
        // {
        //   name: "firefox",
        //   use: { ...devices["Desktop Firefox"] },
        // },
        {
          name: "replay-chromium",
          use: { ...(replayDevices["Replay Chromium"] as any) },
        },
        {
          name: "chromium",
          use: { ...devices["Desktop Chromium"] },
        },
      ]
    : [
        {
          name: "chromium",
          use: { ...devices["Desktop Chromium"] },
        },
      ],
};

if (DEBUG) {
  config.workers = 1;
}

export default config;
