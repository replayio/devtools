/* Copyright 2024 Record Replay Inc. */

const { execSync, exec } = require("child_process");
const getSecret = require("./aws_secrets");

function run_fe_tests(CHROME_BINARY_PATH) {
  console.group("START");
  console.time("START time");
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

    execSync("npx playwright install chromium", {
      stdio: "inherit",
    });

    // Start the webserver.
    let webProc = exec("yarn dev", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
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
    if (!process.env.HASURA_ADMIN_SECRET) {
      process.env.HASURA_ADMIN_SECRET = getSecret("prod/hasura-admin-secret", "us-east-2");
    }

    process.env.RECORD_REPLAY_DISPATCH_SERVER = "wss://dispatch.replay.io";
    process.env.REPLAY_BROWSER_BINARY_PATH = CHROME_BINARY_PATH;
    process.env.REPLAY_CHROMIUM_EXECUTABLE_PATH = CHROME_BINARY_PATH;
    process.env.RECORD_REPLAY_PATH = CHROME_BINARY_PATH;
    // process.env.RECORD_REPLAY_DIRECTORY =
    process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY = process.env.RECORD_REPLAY_API_KEY;
    process.env.PLAYWRIGHT_TEST_BASE_URL = "https://app.replay.io";

    execSync(
      `xvfb-run ./packages/e2e-tests/scripts/save-examples.ts --runtime=chromium --target=browser --project=replay-chromium-local`,
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
      "breakpoints-01",
      "breakpoints-03",
      "breakpoints-04",
      "breakpoints-05",
      //"breakpoints-06",
      "comments-01",
      "comments-02",
      "comments-03",
      "console_async_eval",
      "console_dock",
      "console_eval",
      "console-expressions-01",
      "cypress-01",
      "cypress-02",
      "cypress-03",
      "elements-search",
      "focus_mode-01",
      "logpoints-01",
      "logpoints-02",
      "logpoints-03_chromium",
      "logpoints-05",
      "logpoints-06",
      "logpoints-07",
      "logpoints-08",
      "logpoints-09",
      "network-0",
      "object_preview-03",
      //"object_preview-04",
      "object_preview-05",
      "passport-01",
      "passport-03",
      "passport-04",
      "react_devtools-01-basic.test",
      "react_devtools-03-multiple-versions",
      "react_devtools-04-seeking",
      "scopes_renderer",
      "stacking_chromium",
      "stepping-01",
      //"stepping-05_chromium",
    ];
    execSync(`xvfb-run yarn test:runtime ${testNames.join(" ")}`, {
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
