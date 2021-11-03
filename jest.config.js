module.exports = {
  moduleNameMapper: {
    "ui/(.*)": "<rootDir>/src/ui/$1",
  },
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(test).[jt]s?(x)",
    // If you want to run all of the old tests then remove this ignore pattern
    // "**/?(*.)+(spec).[jt]s?(x)",
  ],
};
