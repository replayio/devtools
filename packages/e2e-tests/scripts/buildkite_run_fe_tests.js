/* Copyright 2024 Record Replay Inc. */

const { execSync, exec } = require("child_process");
const getSecret = require("./aws_secrets");

function run_fe_tests(CHROME_BINARY_PATH) {
  // Install node deps
  execSync("npm i -g yarn", {
    stdio: "inherit",
  });

  execSync("yarn install", {
    stdio: "inherit",
  });

  // Custom NPM dependencies
  execSync("yarn add -D find-in-files", {
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

  // Re-record chromium golden recordings.
  execSync(
    `xvfb-run ./packages/e2e-tests/scripts/save-and-run-chromium-examples.ts`,
    { stdio: "inherit", env: process.env }
  );

  // Make sure the web server shuts down.
  webProc.kill("SIGKILL");

  console.error("Done tests.");

  // Without this, we can hang--no idea why.
  process.exit(0);
}

module.exports = run_fe_tests;
