// playwright.config.ts
import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  expect: {
    toMatchSnapshot: {
      // An acceptable ratio of pixels that are different to the total amount of pixels, between 0 and 1.
      maxDiffPixelRatio: 0.05,

      // An acceptable perceived color difference in the YIQ color space between the same pixel in compared images, between 0 (strict) and 1 (lax).
      threshold: 0.05,
    },
  },
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  use: {
    browserName: "chromium",
    launchOptions: {
      // Useful for visual debugging
      slowMo: 250,
    },
    trace: "on-first-retry",
    viewport: {
      width: 800,
      height: 400,
    },
  },
  testDir: "tests",
  testMatch: ["**/*.ts"],
};

export default config;
