module.exports = {
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
