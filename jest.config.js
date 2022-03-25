module.exports = {
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/fixtures/**",
    "!src/graphql/*.ts",
  ],
  moduleNameMapper: {
    "^devtools/(.*)": "<rootDir>/src/devtools/$1",
    "^highlighter/(.*)": "<rootDir>/src/highlighter/$1",
    "^protocol/(.*)": "<rootDir>/src/protocol/$1",
    "^shims/(.*)": "<rootDir>/src/shims/$1",
    "^toolkit/(.*)": "<rootDir>/src/toolkit/$1",
    "^test/(.*)": "<rootDir>/src/test/$1",
    "^ui/(.*)": "<rootDir>/src/ui/$1",

    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$": `<rootDir>/__mocks__/fileMock.js`,

    // Handle module aliases
    "^@/components/(.*)$": "<rootDir>/components/$1",
  },
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(test).[jt]s?(x)",
    "!**/fixtures/**",
    // The old unit tests in src/devtools are named with ".spec.js".
    // If you want to run them, uncomment the line below.
    // For context, see https://github.com/RecordReplay/devtools/pull/4290
    // "**/?(*.)+(spec).[jt]s?(x)",
  ],
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
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
    "^.+\\.properties$": "<rootDir>/test/jest/jest-text-transformer.js",
  },
  transformIgnorePatterns: ["/node_modules/", "^.+\\.module\\.(css|sass|scss)$"],
  setupFilesAfterEnv: ["<rootDir>/test/jest/setupEnv.js"],
};
