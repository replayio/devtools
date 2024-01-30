/* Copyright 2024 Record Replay Inc. */

import { exec, execSync } from "child_process";
import path from "path";
import uniq from "lodash/uniq";

import { getSecret } from "./aws_secrets";
import { ExampleInfo, getStats } from "./get-stats";

const TestFileBlackList = new Set([]);
const TestFileWhiteList = new Set([]);

/**
 * Re-record all examples that have previously been recorded with
 * "recent Chromium".
 */
function checkReRecord(testFile, exampleFileInfo: ExampleInfo) {
  let shouldTestOnLatest: boolean;
  let shouldTestOverride: boolean;

  const testName = testFile; // TODO
  shouldTestOnLatest =
    exampleFileInfo.runtime === "chromium" &&
    exampleFileInfo.runtimeReleaseDate.getUTCFullYear() === 2024;
  if (TestFileWhiteList.has(testName) && TestFileBlackList.has(testName)) {
    throw new Error(`Test was both in BlackList and WhiteList: ${testName}`);
  }
  if (TestFileWhiteList.has(testName)) {
    shouldTestOverride = true;
  }
  if (TestFileBlackList.has(testName)) {
    shouldTestOverride = false;
  }
  if (shouldTestOverride !== undefined && shouldTestOnLatest !== shouldTestOverride) {
    if (shouldTestOverride) {
      console.warn(`${testName} is not eligible but whitelisted.`);
    } else {
      console.warn(`${testName} is eligible but blacklisted.`);
    }
    return shouldTestOverride;
  }
  return shouldTestOnLatest;
}

/**
 * Get all examples that should re-record and their depending tests.
 */
function gatherChromiumExamplesAndTests() {
  const { testFileToInfoMap } = getStats();
  const testFiles: string[] = [];
  const exampleFiles: string[] = [];

  for (const [testFile, exampleFileInfo] of Object.entries(testFileToInfoMap)) {
    const shouldReRecord = checkReRecord(testFile, exampleFileInfo);
    if (shouldReRecord) {
      testFiles.push(testFile);
      exampleFiles.push(exampleFileInfo.exampleName);
    }
  }

  return { testFiles, exampleFiles: uniq(exampleFiles) };
}

// transforms https://github.com/replayio/chromium.git or
// git@github.com:replayio/chromium to replayio/chromium
function githubUrlToRepository(url) {
  return url?.replace(/.*github.com[:\/](.*)\.git/, "$1");
}

export default function run_fe_tests(CHROME_BINARY_PATH, runInCI = true) {
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
  process.env.RECORD_REPLAY_DISPATCH_SERVER ||= process.env.DISPATCH_ADDRESS ||=
    "wss://dispatch.replay.io";
  process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY = process.env.RECORD_REPLAY_API_KEY;
  process.env.PLAYWRIGHT_TEST_BASE_URL ||= "https://app.replay.io";
  process.env.RECORD_REPLAY_METADATA_SOURCE_REPOSITORY ||= githubUrlToRepository(process.env.RUNTIME_REPO)

  console.debug(`process.env.PLAYWRIGHT_TEST_BASE_URL="${process.env.PLAYWRIGHT_TEST_BASE_URL}"`);

  let webProc;
  if (runInCI) {
    // Get ready.
    execSync("cp .env.sample .env", {
      stdio: "inherit",
    });

    // TODO: We can remove this once we change runtime from `chromium` to `replay-chromium`.
    execSync("npx playwright install chromium", {
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

    // Wait a little, to let the yarn dev server start up.
    execSync("sleep 5");
  }

  try {
    console.timeEnd("START time");
    console.groupEnd();

    console.group("GATHER-EXAMPLES");
    console.time("GATHER-EXAMPLES time");
    const { exampleFiles, testFiles } = gatherChromiumExamplesAndTests();
    console.log(`Examples (${exampleFiles.length}):\n ${exampleFiles.join("\n ")}`);
    console.log(`Tests (${testFiles.length}):\n ${testFiles.join("\n ")}`);
    console.timeEnd("GATHER-EXAMPLES time");

    console.group("SAVE-EXAMPLES");
    console.time("SAVE-EXAMPLES time");
    {
      const examplesCfg = exampleFiles?.length ? ` --example=${exampleFiles.join(",")}` : "";
      execSync(
        `${envWrapper} ${path.join(
          "scripts/save-examples.ts"
        )} --runtime=chromium --target=browser --project=chromium${examplesCfg}`,
        { cwd: TestRootPath, stdio: "inherit", env: process.env }
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
        `${envWrapper} npx playwright test --grep-invert node_ --project=chromium --workers=1 --retries=2 ${testFiles.join(
          " "
        )}`,
        {
          cwd: TestRootPath,
          stdio: "inherit",
          env: {
            ...process.env,
            REPLAY_API_KEY: process.env.RUNTIME_TEAM_API_KEY,
            REPLAY_UPLOAD: "1",
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
    run_fe_tests(undefined, false);
  }
})();
