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
  },
  // Limit the number of workers on CI, use default locally
  workers: CI ? 2 : undefined,
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
