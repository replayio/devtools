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

  execSync("npx playwright install chromium", {
    stdio: "inherit",
  })

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
  process.env.PLAYWRIGHT_TEST_BASE_URL = "https://app.replay.io";

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
    `xvfb-run ./packages/e2e-tests/scripts/save-examples.ts --runtime=chromium --project=replay-chromium-local --example=${htmlFiles.join(
      ","
    )}`,
    { stdio: "inherit" }
  );

  // Without the wait, the next xvfb-run command can fail.
  execSync("sleep 5");

  // Run the known-passind tests.
  const testNames = [
    "comments-01",
    //"comments-02",
    "comments-03",
    "logpoints-01",
    "stepping-05_chromium",
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

  execSync(`xvfb-run yarn test:debug ${testNames.join(" ")}`, {
    stdio: "inherit",
    stderr: "inherit",
  });

  // Make sure the web server shuts down.
  webProc.kill("SIGKILL");

  console.error("Done tests.");

  // Without this, we can hang--no idea why.
  process.exit(0);
}

module.exports = run_fe_tests;
