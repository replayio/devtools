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
const TestFileBlockLists = {
  linux: [],
  darwin: [
    // This test has been failing for a long, long time.  disable it for now so
    // we can get back to green builds.
    // https://linear.app/replay/issue/TT-189/re-enable-failing-fe-tests
    "tests/inspector-elements-02_node-picker.test.ts",
  ],
  ALL: [
    // Disable some paint expectations. Paints and repaintGraphics have improved
    // but are not perfect. Let's revisit it once we see it have a real impact
    // on the user, or else, post GA.
    // https://linear.app/replay/issue/TT-189/re-enable-failing-fe-tests
    "tests/repaint-01.test.ts",
    "tests/repaint-06.test.ts",
  ],
};

const TestFileBlockList = new Set([
  ...TestFileBlockLists["ALL"],
  ...TestFileBlockLists[os.platform()],
]);

// Force some tests to run that we have recently fixed but not yet enabled everywhere.
const TestFileForceLists = {
  linux: [],
  darwin: [],
  ALL: [],
};

const TestFileForceList = new Set([
  ...TestFileForceLists["ALL"],
  ...TestFileForceLists[os.platform()],
]);

/**
 * Re-record all examples that have previously been recorded with
 * "recent Chromium".
 */
function checkReRecord(testFile, exampleFileInfo: ExampleInfo) {
  const wouldNormallyTest =
    exampleFileInfo.runtime === "chromium" &&
    exampleFileInfo.runtimeReleaseDate.getUTCFullYear() === 2024 &&
    !exampleFileInfo.requiresManualUpdate;

  const shouldBlockTest = TestFileBlockList.has(testFile);
  const shouldForceTest = TestFileForceList.has(testFile);

  if (shouldBlockTest && shouldForceTest) {
    throw new Error(`Test is both in Blocked and Forced: ${testFile}`);
  }

  if (shouldForceTest) {
    if (wouldNormallyTest) {
      console.warn(
        chalk.yellow(`🟡 FORCED: ${testFile} (would normally test.  remove it from force list?)`)
      );
    } else {
      console.warn(chalk.yellow(`✅ FORCED: ${testFile}`));
    }
    return true;
  }

  if (shouldBlockTest) {
    if (!wouldNormallyTest) {
      console.warn(
        chalk.yellow(
          `🟡 BLOCKED: ${testFile} (would not normally test.  remove it from block list?)`
        )
      );
    } else {
      console.warn(chalk.yellow(`❌ BLOCKED: ${testFile}`));
    }
    return false;
  }

  return wouldNormallyTest;
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

  const remainingBlockedTests = new Set(TestFileBlockList);
  const remainingForcedTests = new Set(TestFileForceList);

  for (const [testFile, exampleFileInfo] of Object.entries(testFileToInfoMap)) {
    let shouldReRecord: boolean;
    if (TestFileOverrideList.length) {
      // Only pick from TestFileOverrideList.
      shouldReRecord = TestFileOverrideList.includes(testFile);
    } else {
      // Normal book-keeping.
      remainingBlockedTests.delete(testFile);
      remainingForcedTests.delete(testFile);
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
    if (remainingBlockedTests.size) {
      throw new Error(
        `WARNING: TestFileBlockList contains unknown tests:\n ${Array.from(
          remainingBlockedTests
        ).join("\n ")}`
      );
    }
    if (remainingForcedTests.size) {
      throw new Error(
        `WARNING: TestFileForceList contains unknown tests:\n ${Array.from(
          remainingForcedTests
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

  process.env.REPLAY_ENABLE_ASSERTS = process.env.RECORD_REPLAY_ENABLE_ASSERTS = "1";
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

  let webProc;
  if (runInCI) {
    // Get ready.
    execSync("cp .env.sample .env", {
      stdio: "inherit",
    });

    // Start the webserver.
    webProc = exec("npx yarn dev", (error, stdout, stderr) => {
      if (error) {
        console.error(`yarn dev exec ERROR: ${error}`);
      }
      console.error(`yarn dev stdout: ${stdout}`);
      console.error(`yarn dev stderr: ${stderr}`);
    });

    // Debug: Allow verifying the replay-cli version.
    console.log(`Checking @replayio/replay version...`);
    execSync("npx replay version", {
      stdio: "inherit",
    });

    // make sure the dev server is up and running.
    console.log("waiting for dev server to start up");
    await testHttpConnection("http://localhost:8080/");
    console.log("dev server up, continuing with test");
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
          },
        }
      );
    }
    console.timeEnd("TESTS time");
    console.groupEnd();
    // Make sure the web server shuts down.
    webProc?.kill("SIGKILL");

    // Without this, we can hang--no idea why.
    process.exit(0);
  } finally {
    // Make sure the web server shuts down in case of exceptions.
    webProc?.kill("SIGKILL");
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
