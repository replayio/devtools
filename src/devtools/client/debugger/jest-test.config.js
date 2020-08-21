/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

const { resolve } = require("path");
const rootDir = resolve(__dirname);
module.exports = {
  rootDir,
  displayName: "test",
  testURL: "http://localhost/",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/helpers/",
    "/fixtures/",
    "src/test/mochitest/examples/",
    "<rootDir>/firefox",
    "package.json",
    "<rootDir>/packages",
  ],
  modulePathIgnorePatterns: [
    "test/mochitest",
    "<rootDir>/firefox/",
    "<rootDir>/src/client/firefox/",
  ],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/fixtures/*.js",
    "!src/test/**/*.js",
    "!src/components/stories/**/*.js",
    "!**/*.mock.js",
    "!**/*.spec.js",
  ],
  transformIgnorePatterns: ["node_modules/(?!(devtools-|react-aria-))"],
  setupFilesAfterEnv: ["<rootDir>/src/test/tests-setup.js"],
  // setupFiles: ["<rootDir>/src/test/shim.js"],
  snapshotSerializers: [
    require.resolve("jest-serializer-babel-ast"),
    require.resolve("enzyme-to-json/serializer"),
  ],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/src/test/__mocks__/styleMock.js",
    "\\.svg$": "<rootDir>/src/test/__mocks__/svgMock.js",
    "^Services": "<rootDir>/src/test/fixtures/Services",
    // Map all require("devtools/...") to the real devtools root.
    "^devtools\\/(.*)": "<rootDir>/../../$1",
    "^protocol\\/(.*)": "<rootDir>/../../../protocol/$1",
    // src/devtools/client/shared/vendor/WasmParser.js
    "wasmparser/dist/WasmParser": "<rootDir>/../shared/vendor/WasmParser",
    "wasmparser/dist/WasmDis": "<rootDir>/../shared/vendor/WasmDis",
  },
};
