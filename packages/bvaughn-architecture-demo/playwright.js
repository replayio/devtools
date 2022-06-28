#!/usr/bin/env node

"use strict";

const { spawn } = require("child_process");
const { existsSync, rmSync } = require("fs");
const { join } = require("path");

const ROOT_PATH = join(__dirname);

const TIMEOUT_DURATION = 60_000;

const TEST_RESULTS_PATH = join(__dirname, "playwright", "test-results");

let serverProcess = null;
let testProcess = null;

function format(loggable) {
  return `${loggable}`
    .split("\n")
    .filter(line => {
      return line.trim() !== "";
    })
    .map(line => `  ${line}`)
    .join("\n");
}

function logBright(loggable) {
  console.log(`\x1b[1m${loggable}\x1b[0m`);
}

function logDim(loggable) {
  const formatted = format(loggable, 2);
  if (formatted !== "") {
    console.log(`\x1b[2m${formatted}\x1b[0m`);
  }
}

function logError(loggable) {
  const formatted = format(loggable, 2);
  if (formatted !== "") {
    console.error(`\x1b[31m${formatted}\x1b[0m`);
  }
}

function runServer() {
  const timeoutID = setTimeout(() => {
    logError("Server failed to start");

    exitWithCode(1);
  }, TIMEOUT_DURATION);

  logBright("Starting server");

  let severStarted = false;

  serverProcess = spawn("yarn", ["dev"], {
    cwd: ROOT_PATH,
    env: { ...process.env },
  });
  serverProcess.stdout.on("data", data => {
    const stringified = `${data}`.trim();

    if (!severStarted) {
      logDim(stringified);
    }

    if (stringified.includes("started server")) {
      logBright("Testing server running");

      severStarted = true;

      clearTimeout(timeoutID);

      runEndToEndTests();
    }
  });
  serverProcess.stderr.on("data", data => {
    const stringified = `${data}`.trim();
    if (stringified.includes("EADDRINUSE")) {
      // Something is occuprying this port;
      // We could kill the process and restart but probably better to prompt the user to do this.

      logError("Free up the port and re-run tests:");
      logBright("  kill -9 $(lsof -ti:3000)");

      exitWithCode(1);
    } else if (stringified.includes("ERROR")) {
      logError(`Error:\n${data}`);

      exitWithCode(1);
    } else {
      // Non-fatal stuff like Babel optimization warnings etc.
      logDim(data);
    }
  });
}

async function runEndToEndTests() {
  logBright("Running e2e tests");

  if (existsSync(TEST_RESULTS_PATH)) {
    rmSync(TEST_RESULTS_PATH, { recursive: true });
  }

  // Default to "172.17.0.1" for CI.
  const HOST = process.env.HOST || "172.17.0.1";

  testProcess = spawn("earthly", ["+playwright", `--HOST=${HOST}`], {
    ...process.env,
    cwd: join(ROOT_PATH, "playwright"),
  });
  testProcess.stdout.on("data", data => {
    // Log without formatting because Playwright applies its own formatting.
    const formatted = format(data);
    if (formatted !== "") {
      console.log(formatted);
    }
  });
  testProcess.stderr.on("data", data => {
    // Log without formatting because Playwright applies its own formatting.
    const formatted = format(data);
    if (formatted !== "") {
      console.error(formatted);
    }
  });
  testProcess.on("exit", code => {
    logBright(`Tests completed with code: ${code}`);

    // HACK
    // If Playwright fails, it's important that we upload the test-results as GH artifacts.
    // Unfortunately, Earthly won't save artifacts for non-zero exit codes:
    // https://github.com/earthly/earthly/issues/988#issuecomment-873433240
    //
    // So the Earthfile always exits with code 0,
    // and we use the presence of the 'test-results' folder to infer failure.
    if (existsSync(TEST_RESULTS_PATH)) {
      exitWithCode(1);
    }

    exitWithCode(code);
  });
}

function exitWithCode(code) {
  if (serverProcess !== null) {
    try {
      logBright("Shutting down server process");
      serverProcess.kill();
    } catch (error) {
      logError(error);
    }
  }

  if (testProcess !== null) {
    try {
      logBright("Shutting down test process");
      testProcess.kill();
    } catch (error) {
      logError(error);
    }
  }

  logBright(`Exiting with code ${code}`);
  process.exit(code);
}

runServer();
