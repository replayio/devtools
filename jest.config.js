module.exports = {
  moduleNameMapper: {
    "ui/(.*)": "<rootDir>/src/ui/$1",
  },
  // If you want to run all of the old tests then remove this ignore pattern
  modulePathIgnorePatterns: ["src/devtools"],
};
