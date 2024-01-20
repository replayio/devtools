/* Copyright 2024 Record Replay Inc. */

const path = require("path");
const { execSync, exec } = require("child_process");
const getSecret = require("./aws_secrets");

function run_fe_tests(CHROME_BINARY_PATH, useXvfb = true) {
  CHROME_BINARY_PATH ||= process.env.REPLAY_CHROMIUM_EXECUTABLE_PATH;

  if (!CHROME_BINARY_PATH) {
    throw new Error("No chromium binary path (nor REPLAY_CHROMIUM_EXECUTABLE_PATH) provided.");
  }

  console.group("START");
  console.time("START time");

  const envWrapper = useXvfb ? "xvfb-run" : "";
  const TestRootPath = path.join(
    process.env.REPLAY_DIR ? path.join(process.env.REPLAY_DIR, "devtools") : ".",
    "packages/e2e-tests"
  );

  process.env.HASURA_ADMIN_SECRET ||= getSecret("prod/hasura-admin-secret", "us-east-2");

  // TODO: Our over-use of defined and re-defined env vars is great...
  process.env.RECORD_REPLAY_DISPATCH_SERVER ||= (process.env.DISPATCH_ADDRESS ||= "wss://dispatch.replay.io");
  process.env.REPLAY_BROWSER_BINARY_PATH = CHROME_BINARY_PATH;
  process.env.REPLAY_CHROMIUM_EXECUTABLE_PATH = CHROME_BINARY_PATH;
  process.env.RECORD_REPLAY_PATH = CHROME_BINARY_PATH;
  // process.env.RECORD_REPLAY_DIRECTORY =
  process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY = process.env.RECORD_REPLAY_API_KEY;
  process.env.PLAYWRIGHT_TEST_BASE_URL = "https://app.replay.io";

  // TODO: See if this makes a difference
  // process.env.REPLAY_DISABLE_CLONE = "1";

  let webProc = null;
  {
    // Install node deps
    execSync("npm i -g yarn", {
      stdio: "inherit",
    });

    execSync("yarn install", {
      stdio: "inherit",
    });

    execSync("cp .env.sample .env", {
      stdio: "inherit",
    });

    // TODO: Do we need this?
    execSync("npx playwright install chromium", {
      stdio: "inherit",
    });

    // Start the webserver.
    webProc = exec("yarn dev", (error, stdout, stderr) => {
      if (error) {
        console.error(`yarn dev exec error: ${error}`);
        return;
      }
      console.error(`yarn dev stdout: ${stdout}`);
      console.error(`yarn dev stderr: ${stderr}`);
    });

    // Wait a little, to let the yarn dev server start up.
    execSync("sleep 5");
  }
  console.timeEnd("START time");
  console.groupEnd();

  console.group("SAVE-EXAMPLES");
  console.time("SAVE-EXAMPLES time");
  {


    // Generate new recordings for known-passing tests with the new chromium build.
    const htmlFiles = [
      "authenticated_comments.html",
      "authenticated_logpoints.html",
      "doc_minified_chromium.html",
      "doc_recursion.html",
      "doc_rr_console.html",
      "doc_rr_preview.html",
      "doc_rr_region_loading.html",
      "doc_stacking_chromium.html",
      "rdt-react-versions/dist/index.html",
    ];

    execSync(
      `${envWrapper} ${path.join(TestRootPath, "scripts/save-examples.ts")} --runtime=chromium --project=replay-chromium-local --example=${htmlFiles.join(
        ","
      )}`,
      { stdio: "inherit", env: process.env }
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
    const testNames = [
      "comments-01",
      //"comments-02",
      "comments-03",
      "logpoints-01",
      //"stepping-05_chromium",
      "scopes_renderer",
      "passport-01",
      "passport-03",
      "passport-04",
      "object_preview-03",
      "focus_mode-01",
      "elements-search",
      "stacking_chromium",
      "react_devtools-03-multiple-versions",
    ];
    execSync(`${envWrapper} yarn test:runtime ${testNames.join(" ")}`, {
      stdio: "inherit",
      stderr: "inherit",
    });

    // Make sure the web server shuts down.
    webProc.kill("SIGKILL");
  }
  console.timeEnd("TESTS time");
  console.groupEnd();

  // Without this, we can hang--no idea why.
  process.exit(0);
}

module.exports = run_fe_tests;


/** ###########################################################################
 * {@link main}
 * ##########################################################################*/

(async function main() {
  if (process.argv[1] === __filename) {
    runtime_fe_tests(undefined, false);
  }
})();
