import { PlaywrightTestConfig, devices } from "@playwright/test";

const { DEBUG } = process.env;

const config: PlaywrightTestConfig = {
  use: {
    headless: !DEBUG,
    browserName: "chromium",
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
