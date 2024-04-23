/* Copyright 2024 Record Replay Inc. */

import { exec, execSync } from "child_process";
import http from "http";
import os from "os";
import path from "path";
import chalk from "chalk";
import difference from "lodash/difference";
import size from "lodash/size";

import { getSecret } from "./aws_secrets";
import { ExampleInfo, getStats } from "./get-stats";

const CONFIG = {
  // Allow overriding recorder debug output.
  RecorderVerboseOverride: false,
};

// We use this for debugging purposes only.
let TestFileOverrideList = [];

// Disable some tests that we know to be problematic.
const TestFileBlackList = new Set([
  // Disable some paint expectations. Paints and repaintGraphics have improved
  // but are not perfect. Let's revisit it once we see it have a real impact
  // on the user, or else, post GA.
  // https://linear.app/replay/issue/TT-189/re-enable-repaint-01-repaint-06
  "tests/repaint-01.test.ts",
  "tests/repaint-06.test.ts",
]);

// Enable some tests that we have recently fixed but not yet enabled everywhere.
const TestFileWhiteList = new Set([]);

/**
 * Re-record all examples that have previously been recorded with
 * "recent Chromium".
 */
function checkReRecord(testFile, exampleFileInfo: ExampleInfo) {
  let shouldTestOnLatest: boolean;
  let shouldTestOverride: boolean;

  shouldTestOnLatest =
    exampleFileInfo.runtime === "chromium" &&
    exampleFileInfo.runtimeReleaseDate.getUTCFullYear() === 2024 &&
    !exampleFileInfo.requiresManualUpdate;
  if (TestFileWhiteList.has(testFile) && TestFileBlackList.has(testFile)) {
    throw new Error(`Test was both in BlackList and WhiteList: ${testFile}`);
  }
  if (TestFileWhiteList.has(testFile)) {
    shouldTestOverride = true;
  }
  if (TestFileBlackList.has(testFile)) {
    shouldTestOverride = false;
  }
  if (shouldTestOverride !== undefined && shouldTestOnLatest !== shouldTestOverride) {
    if (shouldTestOverride) {
      console.warn(chalk.yellow(`✅ WHITELISTED: ${testFile}`));
    } else {
      console.warn(chalk.yellow(`❌ BACKLISTED: ${testFile}`));
    }
    return shouldTestOverride;
  }
  return shouldTestOnLatest;
}

function computePct(current: number, total: number) {
  return Math.round((current / total) * 100);
}

/**
 * Get all examples that should re-record and their depending tests.
 */
function gatherChromiumExamplesAndTests() {
  const { testFileToInfoMap, exampleToTestMap } = getStats();
  const testFiles = new Set<string>();
  const exampleFiles = new Set<string>();

  const remainingBlackListTests = new Set(TestFileBlackList);
  const remainingWhiteListTests = new Set(TestFileWhiteList);

  for (const [testFile, exampleFileInfo] of Object.entries(testFileToInfoMap)) {
    let shouldReRecord: boolean;
    if (TestFileOverrideList.length) {
      // Only pick from TestFileOverrideList.
      shouldReRecord = TestFileOverrideList.includes(testFile);
    } else {
      // Normal book-keeping.
      remainingBlackListTests.delete(testFile);
      remainingWhiteListTests.delete(testFile);
      shouldReRecord = checkReRecord(testFile, exampleFileInfo);
    }
    if (shouldReRecord) {
      testFiles.add(testFile);
      exampleFiles.add(exampleFileInfo.exampleName);
    }
  }

  console.log(
    `Examples (${exampleFiles.size}, ${computePct(
      exampleFiles.size,
      size(exampleToTestMap)
    )}%):\n ${Array.from(exampleFiles).join(", ")}`
  );
  console.log(
    `Tests (${testFiles.size}, ${computePct(
      testFiles.size,
      size(testFileToInfoMap)
    )}%):\n ${Array.from(testFiles).join(", ")}`
  );

  if (TestFileOverrideList.length) {
    // Only check TestFileOverrideList.
    const diff = difference(TestFileOverrideList, Array.from(testFiles));
    if (diff.length) {
      throw new Error(`TestFileOverrideList contained unknown tests: ${diff.join(",")}`);
    }
  } else {
    // Normal book-keeping.
    if (remainingBlackListTests.size) {
      throw new Error(
        `WARNING: TestFileBlackList contains unknown tests:\n ${Array.from(
          remainingBlackListTests
        ).join("\n ")}`
      );
    }
    if (remainingWhiteListTests.size) {
      throw new Error(
        `WARNING: TestFileWhiteList contains unknown tests:\n ${Array.from(
          remainingWhiteListTests
        ).join("\n ")}`
      );
    }
  }

  return { testFiles: Array.from(testFiles), exampleFiles: Array.from(exampleFiles) };
}

// transforms https://github.com/replayio/chromium.git or
// git@github.com:replayio/chromium to replayio/chromium
function githubUrlToRepository(url) {
  return url?.replace(/.*github.com[:\/](.*)\.git/, "$1");
}

function testHttpConnection(
  url: string,
  timeoutMs = 15000 // keep waiting for 15s total
): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function attemptConnection() {
      const request = http.get(url, async res => {
        if (res.statusCode < 500) {
          // As long as we can connect at all, we should be fine.
          resolve();
          return;
        }

        console.error(`Server is up, but responded with status code ${res.statusCode}`);

        if (Date.now() - startTime >= timeoutMs) {
          reject(
            new Error(`Server did not respond with 200 OK within ${timeoutMs / 1000} seconds`)
          );
          return;
        }

        setTimeout(attemptConnection, 1000); // Retry after 1 second
      });

      request.on("error", (err: Error) => {
        if (err["code"] === "ECONNREFUSED") {
          if (Date.now() - startTime >= timeoutMs) {
            reject(new Error(`Failed to connect to the server within ${timeoutMs / 1000} seconds`));
            return;
          }

          setTimeout(attemptConnection, 1000); // Retry after 1 second if connection was refused
          return;
        }

        reject(new Error(`Error while trying to connect to the server: ${err.message}`));
      });

      request.end();
    }

    attemptConnection();
  });
}

export default async function run_fe_tests(
  CHROME_BINARY_PATH,
  runInCI = true,
  nWorkers = 4,
  testOverrides?: string[]
) {
  if (testOverrides) {
    TestFileOverrideList = testOverrides;
  }
  console.group("START");
  console.time("START time");

  const envWrapper = runInCI && os.platform() === "linux" ? "xvfb-run" : "";
  const TestRootPath = path.join(
    process.env.REPLAY_DIR ? path.join(process.env.REPLAY_DIR, "devtools") : ".",
    "packages/e2e-tests"
  );

  CHROME_BINARY_PATH ||= process.env.REPLAY_CHROMIUM_EXECUTABLE_PATH;
  if (!CHROME_BINARY_PATH) {
    console.warn(
      "No chromium binary path (nor REPLAY_CHROMIUM_EXECUTABLE_PATH) provided. Using system default."
    );
  }
  if (CHROME_BINARY_PATH) {
    process.env.REPLAY_BROWSER_BINARY_PATH = CHROME_BINARY_PATH;
    process.env.REPLAY_CHROMIUM_EXECUTABLE_PATH = CHROME_BINARY_PATH;
    process.env.RECORD_REPLAY_PATH = CHROME_BINARY_PATH;
  }
  // process.env.RECORD_REPLAY_DIRECTORY =

  process.env.HASURA_ADMIN_SECRET ||= getSecret("prod/hasura-admin-secret", "us-east-2");
  process.env.DISPATCH_ADDRESS ||= "wss://dispatch.replay.io";
  process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY = process.env.RECORD_REPLAY_API_KEY;
  process.env.RECORD_REPLAY_METADATA_SOURCE_REPOSITORY ||= githubUrlToRepository(
    process.env.RUNTIME_REPO
  );

  if (CONFIG.RecorderVerboseOverride) {
    process.env.RECORD_REPLAY_VERBOSE = "1";
  }

  // Debug replay:cli by default.
  process.env.DEBUG = "replay:cli";

  let dashboardProc;
  let devtoolsProc;
  if (runInCI) {
    // Get ready.
    execSync("cp .env.sample .env", {
      stdio: "inherit",
    });

    // Start the dashboard server
    dashboardProc = exec("pnpm dev -- -p 8080", {
      env: {
        ...process.env,
        DEVTOOLS_URL: "http://localhost:8081",
      }
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`dashboard server ERROR: ${error}`);
      }
      console.error(`dashboard server stdout: ${stdout}`);
      console.error(`dashboard server stderr: ${stderr}`);
    });

    // Start the devtools server.
    devtoolsProc = exec("npm exec next dev -- -p 8081", {
      env: {
        ...process.env,
        DASHBOARD_URL: "http://localhost:8080",
      }
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`devtools server ERROR: ${error}`);
      }
      console.error(`devtools server stdout: ${stdout}`);
      console.error(`devtools server stderr: ${stderr}`);
    });

    // Debug: Allow verifying the replay-cli version.
    console.log(`Checking @replayio/replay version...`);
    execSync("npx replay version", {
      stdio: "inherit",
    });

    // make sure the servers are up and running.
    console.log("waiting for dev servers to start up");
    await testHttpConnection("http://localhost:8080/");
    console.log("dev servers up, continuing with test");
  }

  try {
    console.timeEnd("START time");
    console.groupEnd();

    console.group("GATHER-EXAMPLES");
    console.time("GATHER-EXAMPLES time");
    const { exampleFiles, testFiles } = gatherChromiumExamplesAndTests();
    console.timeEnd("GATHER-EXAMPLES time");

    console.group("SAVE-EXAMPLES");
    console.time("SAVE-EXAMPLES time");
    {
      const examplesCfg = exampleFiles?.length ? ` --example=${exampleFiles.join(",")}` : "";
      execSync(
        `${envWrapper} ${path.join(
          "scripts/save-examples.ts"
        )} --runtime=chromium --target=browser ${examplesCfg}`,
        {
          cwd: TestRootPath,
          stdio: "inherit",
          env: {
            ...process.env,
            // Run the tests against the local dev server.
            PLAYWRIGHT_TEST_BASE_URL: "http://localhost:8080",
          },
        }
      );

      // Without the wait, the next xvfb-run command can fail.
      execSync("sleep 5");
    }
    console.timeEnd("SAVE-EXAMPLES time");
    console.groupEnd();

    console.group("TESTS");
    console.time("TESTS time");
    {
      // Run the known-passing tests.
      execSync(
        `${envWrapper} npx playwright test --grep-invert node_ --project=replay-chromium --workers=${nWorkers} --retries=2 ${testFiles.join(
          " "
        )}`,
        {
          cwd: TestRootPath,
          stdio: "inherit",
          env: {
            ...process.env,
            // Replay the tests against prod backend devtools.
            PLAYWRIGHT_TEST_BASE_URL: "https://app.replay.io",
            REPLAY_API_KEY: process.env.RUNTIME_TEAM_API_KEY,
            REPLAY_UPLOAD: "1",

            // [RUN-3257] Enable JS ASSERTS:
            RECORD_REPLAY_JS_OBJECT_ASSERTS: "1",
            RECORD_REPLAY_JS_PROGRESS_ASSERTS: "1",
            RECORD_REPLAY_JS_PROGRESS_CHECKS: "1",

            // [RUN-3246] Send P/W metadata:
            REPLAY_PLAYWRIGHT_FIXTURE: "1",
          },
        }
      );
    }
    console.timeEnd("TESTS time");
    console.groupEnd();
    // Make sure the web servers shut down.
    dashboardProc?.kill("SIGKILL");
    devtoolsProc?.kill("SIGKILL");

    // Without this, we can hang--no idea why.
    process.exit(0);
  } finally {
    // Make sure the web servers shut down in case of exceptions.
    dashboardProc?.kill("SIGKILL");
    devtoolsProc?.kill("SIGKILL");
  }
}

/** ###########################################################################
 * {@link main}
 * ##########################################################################*/

(async function main() {
  if (process.argv[1] === __filename) {
    const testWorkers = process.argv.slice(2);
    run_fe_tests(undefined, false, 1 /* nWorkers */, testWorkers);
  }
})();
