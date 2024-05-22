import { PlaywrightTestConfig, ReporterDescription, devices } from "@playwright/test";
import { devices as replayDevices, replayReporter } from "@replayio/playwright";

const { CI, SLOW_MO } = process.env;

const projects = [
  {
    name: "replay-chromium-local",
    use: {
      launchOptions: {
        executablePath:
          process.env["REPLAY_BROWSER_BINARY_PATH"] ||
          process.env.REPLAY_DIR + "/chromium/src/out/Release/chrome",
      },
    },
  },
  {
    name: "replay-chromium",
    use: {
      ...replayDevices["Replay Chromium"],
    },
  },
  {
    name: "chromium",
    use: { ...devices["Desktop Chromium"] },
  },
];

const reporter: ReporterDescription[] = [["line"]];

if (CI) {
  reporter.unshift(replayReporter());
}

const config: PlaywrightTestConfig = {
  use: {
    launchOptions: {
      slowMo: SLOW_MO ? parseInt(SLOW_MO, 10) : 0,
    },
    viewport: {
      width: 1280,
      height: 1024,
    },
    // Don't allow any one action to take more than 60s
    actionTimeout: 60_000,
  },

  expect: {
    timeout: 15_000,
  },

  // Retry failed tests on CI to account for some basic flakiness.
  retries: CI ? 3 : 0,

  // Give individual tests 5 minutes to complete instead of default 30s
  timeout: 300_000,

  // Limit the number of workers on CI, use default locally
  workers: CI ? 4 : undefined,
  projects,
  reporter,
};

export default config;
