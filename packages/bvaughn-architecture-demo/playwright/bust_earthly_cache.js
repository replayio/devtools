#!/usr/bin/env node

"use strict";

// Earthly will skip steps if it caches unchanged content since a previous copy.
// In our case, if test code has not changed (only UI code), this can lead to false positives where no tests get copied over.
// To break this cache, this file writes a random number to a git-ignored file.

const { writeFileSync } = require("fs");
const { join } = require("path");

// Earthly won't save artifacts if the process exits with a non-zero code.
// This file writes errors to a specific file ("playwright_error") if an error occurs.
// If the "playwright_error" file exists, Earthly will save the "test-results" folder as an artifact.
// If the "test-results" artifact is saved, the GitHub Workflow will infer failure.

const PATH = join(__dirname, "cache_buster");

writeFileSync(PATH, `${Math.random()}`);

process.exit(0);
