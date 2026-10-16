import { PlaywrightTestConfig } from "@playwright/test";
import { devices as replayDevices, replayReporter } from "@replayio/playwright";

import baseConfig from "../playwright.config";

// Runs a test run example's spec in Replay Chromium. `save-examples.ts` uploads
// the recording, so the reporter only attaches the test metadata to it.
const config: PlaywrightTestConfig = {
  ...baseConfig,
  testDir: ".",
  testMatch: "**/*.spec.ts",
  testIgnore: undefined,
  retries: 0,
  workers: 1,
  projects: [
    {
      name: "replay-chromium",
      use: {
        ...replayDevices["Replay Chromium"],
      },
    },
  ],
  reporter: [["line"], replayReporter({ upload: false })],
};

export default config;
