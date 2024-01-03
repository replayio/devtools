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

  execSync("cp .env.sample .env", {
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
  process.env.AUTHENTICATED_TESTS_WORKSPACE_API_KEY = process.env.RECORD_REPLAY_API_KEY;

  // Generate new recordings with the new chromium build.
  execSync(
    `xvfb-run ./packages/e2e-tests/scripts/save-examples.ts --runtime=chromium --project=replay-chromium-local --example=authenticated_comments_1.html`,
    { stdio: "inherit" }
  );

  // Without the wait, the next xvfb-run command can fail.
  execSync("sleep 5");

  // Run the tests.
  execSync(`xvfb-run yarn test:debug_local comments-01`, { stdio: "inherit", stderr: "inherit" });

  // Make sure the web server shuts down.
  webProc.kill("SIGKILL");

  console.error("Done tests.");

  // Without this, we can hang--no idea why.
  process.exit(0);
}

module.exports = run_fe_tests;
