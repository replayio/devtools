import { PlaywrightTestConfig, devices } from "@playwright/test";
import { devices as replayDevices } from "@replayio/playwright";

const config: PlaywrightTestConfig = {
  projects: [
    // {
    //   name: "replay-firefox",
    //   use: { ...(replayDevices["Replay Firefox"] as any) },
    // },
    // {
    //   name: "replay-chromium",
    //   use: { ...(replayDevices["Replay Chromium"] as any) },
    // },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // {
    //   name: "chromium",
    //   use: { ...devices["Desktop Chromium"] },
    // },
  ],
};
export default config;
