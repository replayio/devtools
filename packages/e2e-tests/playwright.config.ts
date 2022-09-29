import { PlaywrightTestConfig, devices } from "@playwright/test";

const { DEBUG, SLOW_MO } = process.env;

const config: PlaywrightTestConfig = {
  use: {
    headless: !DEBUG,
    browserName: "chromium",
    launchOptions: {
      slowMo: SLOW_MO ? parseInt(SLOW_MO, 10) : undefined,
    },
    viewport: {
      width: 1280,
      height: 1024,
    },
  },
};

if (DEBUG) {
  config.workers = 1;
}

export default config;
