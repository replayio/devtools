import { PlaywrightTestConfig, ReporterDescription, devices } from "@playwright/test";
import { devices as replayDevices } from "@replayio/playwright";

const { CI, SLOW_MO, SHARD_NUMBER } = process.env;

const projects = [
  {
    name: "replay-chromium",
    use: { ...(replayDevices["Replay Chromium"] as any) },
  },
  {
    name: "chromium",
    use: { ...devices["Desktop Chromium"] },
  },
];

const reporters: ReporterDescription[] = [["line"]];

console.log("CI: ", CI);
if (CI) {
  console.log("Adding monocart reporter");
  reporters.unshift(
    [
      "monocart-reporter",
      {
        name: "My Test Report",
        outputFile: `./test-results/monocart-report_${SHARD_NUMBER}.html`,
        coverage: {
          reports: [["html"], ["v8-json"]],

          entryFilter: (entry: any) => {
            console.log("Entry: ", entry.url);
            const ignoreUrls = ["cdn", "webreplay"];
            for (const ignoreUrl of ignoreUrls) {
              if (entry.url.includes(ignoreUrl)) {
                return false;
              }
            }
            return true;
          },
          sourceFilter: (sourcePath: string) => {
            const regex = /(src|replay-next|packages|pages)\/.+\.(t|j)sx?/gm;

            //return sourcePath.search(/src|replay-next\/.+/) !== -1;
            const matches = regex.test(sourcePath);
            const isNodeModules = sourcePath.includes("node_modules");
            console.log("Source: ", sourcePath, matches);
            return matches && !isNodeModules;
          },
          onEnd: async (reportData: any) => {
            console.log("Coverage onEnd: ", reportData);
          },
        },
        onEnd: async (reportData: any, capability: any) => {
          console.log("Working dir: ", process.cwd());
          console.log(reportData.summary);
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
