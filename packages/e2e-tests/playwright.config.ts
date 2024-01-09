import { PlaywrightTestConfig, ReporterDescription, devices } from "@playwright/test";
import { devices as replayDevices } from "@replayio/playwright";

const { CI, SLOW_MO, SHARD_NUMBER } = process.env;

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
      ...(replayDevices["Replay Chromium"] as any),
    },
  },
  {
    name: "chromium",
    use: { ...devices["Desktop Chromium"] },
  },
];

const reporters: ReporterDescription[] = [["line"]];

if (CI) {
  reporters.unshift(
    [
      "monocart-reporter",
      {
        name: "Replay E2E Coverage Report",
        outputFile: `./test-results/monocart-report_${SHARD_NUMBER}.html`,
        coverage: {
          reports: [["json", { file: "./test-results/istanbul-coverage-report.json" }]],

          entryFilter: (entry: any) => {
            // These entries aren't relevant for our own source,
            // or result in bogus file paths that throw errors when written to disk
            const ignoreUrls = [
              "cdn",
              "webreplay",
              "node_modules",
              "_buildManifest",
              "_ssgManifest",
            ];

            for (const ignoreUrl of ignoreUrls) {
              if (entry.url.includes(ignoreUrl)) {
                return false;
              }
            }
            return true;
          },
          sourceFilter: (sourcePath: string) => {
            const validSourceRegex = /(src|replay-next|packages|pages)\/.+\.(t|j)sx?/gm;

            const matches = validSourceRegex.test(sourcePath);
            const isNodeModules = sourcePath.includes("node_modules");

            return matches && !isNodeModules;
          },
          onEnd: async (reportData: any) => {
            console.log("Coverage generated: ", reportData.summary);
          },
        },
      },
    ],
    ["@replayio/playwright/reporter"]
  );
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
    // Don't allow any one action to take more than 15s
    actionTimeout: 15_000,
  },

  expect: {
    timeout: 10_000,
  },

  // Retry failed tests on CI to account for some basic flakiness.
  retries: CI ? 3 : 0,

  // Give individual tests 5 minutes to complete instead of default 30s
  timeout: 300_000,

  // Limit the number of workers on CI, use default locally
  workers: CI ? 4 : undefined,
  projects,
  reporter: reporters,
};

export default config;
