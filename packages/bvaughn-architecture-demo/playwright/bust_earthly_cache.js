#!/usr/bin/env node

"use strict";

// Earthly will skip steps if it caches unchanged content since a previous copy.
// In our case, if test code has not changed (only UI code), this can lead to false positives where no tests get copied over.
// To break this cache, this file writes a random number to a git-ignored file.

const { writeFileSync } = require("fs");
const { join } = require("path");

const PATH = join(__dirname, "cache_buster");

writeFileSync(PATH, `${Math.random()}`);

process.exit(0);
