import { FullConfig } from "@playwright/test";

const { CI, RECORD_PROTOCOL_DATA, RECORD_VIDEO, SLOW_MO, VISUAL_DEBUG } = process.env;

let slowMo = 10;
if (SLOW_MO) {
  slowMo = parseInt(SLOW_MO, 10);
} else if (VISUAL_DEBUG) {
  slowMo = 250;
} else if (RECORD_PROTOCOL_DATA) {
  slowMo = 100;
}

const config: FullConfig = {
  workers: 1,
  forbidOnly: !!CI,
  // @ts-ignore
  reporter: CI ? "github" : "list",
  retries: 2,
  use: {
    browserName: "chromium",
    launchOptions: {
      slowMo,
    },
    viewport: {
      width: 1024,
      height: 600,
    },
  },
  testDir: __dirname,
  testMatch: ["tests/**/*.ts"],
  timeout: 30_000,
};

export default config;
