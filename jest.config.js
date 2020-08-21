/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

/* global __dirname */

const { resolve } = require("path");
const rootDir = resolve(__dirname);

module.exports = {
  projects: [
    "<rootDir>/src/devtools/client/debugger/jest-test.config.js",
    // "<rootDir>/src/devtools/client/debugger/packages/*/jest.config.js",
  ],
};
