/* Copyright 2024 Record Replay Inc. */

import { exec, execSync } from "child_process";
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
const TestFileOverrideList = [];

// Disable some tests that we know to be problematic.
const TestFileBlackList = new Set([
  // https://linear.app/replay/issue/RUN-3222/
  "tests/jump-to-code-01_basic.test.ts",
  // https://linear.app/replay/issue/RUN-3224/
  "authenticated/comments-03.test.ts",
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

export default function run_fe_tests(CHROME_BINARY_PATH, runInCI = true, nWorkers = 4) {
  console.group("START");
  console.time("START time");

  const envWrapper = runInCI ? "xvfb-run" : "";
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

  let webProc;
  if (runInCI) {
    // Get ready.
    execSync("cp .env.sample .env", {
      stdio: "inherit",
    });

    // Start the webserver.
    webProc = exec("yarn dev", (error, stdout, stderr) => {
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

    // Wait a little, to let the yarn dev server start up.
    execSync("sleep 2");
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
    run_fe_tests(undefined, false, 1 /* nWorkers */);
  }
})();
