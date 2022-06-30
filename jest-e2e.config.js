const path = require("path");
// ts-jest does not compile custom reporters written in TS:
// https://github.com/kulshekhar/ts-jest/issues/1811
// Use ts-node to let that compile on import
require("ts-node").register();

/** @typedef {import('ts-jest/dist/types')} */
/** @type {import('@jest/types').Config.InitialOptions} */
const e2eJestConfig = {
  setupFilesAfterEnv: ["./test/e2e/setupEnv.ts"],
  testMatch: ["**/e2e/tests/*.test.ts"],
  testTimeout: 480_000,
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        presets: ["next/babel"],
      },
    ],
  },
};

if (process.env.E2E_CODE_COVERAGE) {
  console.log("Configuring custom reporter...");
  e2eJestConfig.reporters = [
    "default",
    [
      "<rootDir>/test/jest/jest-e2e-coverage-reporter/jest-e2e-coverage-reporter.ts",
      {
        sourceRoot: __dirname,
        resultDir: path.join(__dirname, "coverage"),
        reports: [["html"]],
        rewritePath: ({ absolutePath, relativePath }) => {
          // console.log("Original path: ", absolutePath);
          const rewrittenPath = absolutePath.replace("_N_E/", "").replace(/\?(\w|\d)+$/, "");
          // console.log("Rewritten path: ", rewrittenPath);
          return rewrittenPath;
        },
      },
    ],
  ];
}

module.exports = e2eJestConfig;
