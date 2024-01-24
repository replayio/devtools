module.exports = {
  collectCoverageFrom: [
    "packages/protocol/**/*.{js,jsx,ts,tsx}",
    "packages/shared/**/*.{js,jsx,ts,tsx}",
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/fixtures/**",
    "!packages/shared/graphql/generated/*.ts",
  ],
  moduleNameMapper: {
    "^devtools/(.*)": "<rootDir>/src/devtools/$1",
    "^highlighter/(.*)": "<rootDir>/src/highlighter/$1",
    "^components/(.*)": "<rootDir>/packages/components/$1",
    "^protocol/(.*)": "<rootDir>/packages/protocol/$1",
    "^shared/(.*)": "<rootDir>/packages/shared/$1",
    "^shims/(.*)": "<rootDir>/src/shims/$1",
    "^toolkit/(.*)": "<rootDir>/src/toolkit/$1",
    "^test/(.*)": "<rootDir>/src/test/$1",
    "^ui/(.*)": "<rootDir>/src/ui/$1",
    "^third-party/(.*)": "<rootDir>/packages/third-party/$1",

    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    "\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets
    "\\.(jpg|jpeg|png|gif|webp|avif|svg)$": `<rootDir>/__mocks__/fileMock.js`,

    // Handle module aliases
    "^@/components/(.*)$": "<rootDir>/components/$1",

    "^replay-next/(.*)": "<rootDir>/packages/replay-next/$1",
  },
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(test).[jt]s?(x)",
    "!**/fixtures/**",
    // The old unit tests in src/devtools are named with ".spec.js".
    // If you want to run them, uncomment the line below.
    // For context, see https://github.com/RecordReplay/devtools/pull/4290
    // "**/?(*.)+(spec).[jt]s?(x)",
  ],
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/", "e2e"],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    "^.+\\.(js|jsx|ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            jsx: true,
            tsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],

    // Handle text file imports
    "^.+\\.properties$": "<rootDir>/test/jest/jest-text-transformer.js",
  },
  transformIgnorePatterns: ["/node_modules/", "^.+\\.module\\.(css|sass|scss)$"],
  setupFilesAfterEnv: ["<rootDir>/test/jest/setupEnv.js"],
  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "<rootDir>/test-results",
      outputName: "test-result-jest.xml",
      addFileAttribute: "true",
      uniqueOutputName: "true",
      ancestorSeparator: "",
      includeConsoleOutput: "true",
      reportTestSuiteErrors: "true",
    }]
  ]
};
