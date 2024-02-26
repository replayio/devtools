module.exports = {
  moduleNameMapper: {
    "^replay-next/(.*)": "<rootDir>/$1",
    "^design/(.*)": "<rootDir>/../design/$1",
    "^protocol/(.*)": "<rootDir>/../protocol/$1",
    "^shared/(.*)": "<rootDir>/../shared/$1",

    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    "\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "\\.(css|sass|scss)$": "<rootDir>/../../__mocks__/styleMock.js",

    // Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets
    "\\.(jpg|jpeg|png|gif|webp|avif|svg)$": `<rootDir>/../../__mocks__/fileMock.js`,
  },
  testEnvironment: "jsdom",
  testMatch: ["**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["node_modules"],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        presets: ["next/babel"],
        plugins: ["babel-plugin-transform-import-meta"],
      },
    ],

    // Handle text file imports
    "^.+\\.properties$": "<rootDir>/../../test/jest/jest-text-transformer.js",
  },
  transformIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/tests",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setupEnv.js"],
  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "<rootDir>/../../test-results",
      outputName: "replay-next-test-result-jest.xml",
      addFileAttribute: "true",
      uniqueOutputName: "true",
      ancestorSeparator: "",
      includeConsoleOutput: "true",
      reportTestSuiteErrors: "true",
    }]
  ]
};
