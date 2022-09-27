import { PlaywrightTestConfig, devices } from "@playwright/test";
import { devices as replayDevices } from "@replayio/playwright";

const config: PlaywrightTestConfig = {
  use: {
    browserName: "chromium",
    viewport: {
      width: 1024,
      height: 600,
    },
  },
};

export default config;
