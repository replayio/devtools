// playwright.config.ts
import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  expect: {
    toMatchSnapshot: {
      // Account for minor difference in e.g. text rendering and resolution
      // between headless and in-browser tests.
      threshold: 0.5,
    },
  },
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  use: {
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
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  testDir: "tests",
  testMatch: ["**/*.ts"],
};

export default config;
