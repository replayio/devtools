import { PlaywrightTestConfig, devices } from "@playwright/test";

const { DEBUG } = process.env;

const config: PlaywrightTestConfig = {
  use: {
    headless: !DEBUG,
    browserName: "chromium",
    viewport: {
      width: 1024,
      height: 600,
    },

  },
};
export default config;
