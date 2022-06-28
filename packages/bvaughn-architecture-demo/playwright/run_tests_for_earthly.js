#!/usr/bin/env node

"use strict";

const { execSync } = require("child_process");
const { existsSync, rmSync, writeFileSync } = require("fs");
const { join } = require("path");

// Earthly won't save artifacts if the process exits with a non-zero code.
// This file writes errors to a specific file ("playwright_error") if an error occurs.
// If the "playwright_error" file exists, Earthly will save the "test-results" folder as an artifact.
// If the "test-results" artifact is saved, the GitHub Workflow will infer failure.

const FAIL_PATH = join(__dirname, "playwright_error");

if (existsSync(FAIL_PATH)) {
  console.log("Removing prev playwright_error file");
  rmSync(FAIL_PATH);
}

try {
  console.log("Running tests");

  execSync("yarn test", {
    cwd: __dirname,
    env: process.env,
    stdio: "inherit",
  });
} catch (error) {
  console.log("Tests failed");
  console.error(error);

  writeFileSync(FAIL_PATH, error.message);
}

process.exit(0);
