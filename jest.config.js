module.exports = {
  moduleNameMapper: {
    "ui/(.*)": "<rootDir>/src/ui/$1",
  },
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(test).[jt]s?(x)",
    // The old unit tests in src/devtools are named with ".spec.js".
    // If you want to run them, uncomment the line below.
    // For context, see https://github.com/RecordReplay/devtools/pull/4290
    // "**/?(*.)+(spec).[jt]s?(x)",
  ],
};
