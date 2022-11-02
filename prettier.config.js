const pluginImportSort = require("prettier-plugin-import-sort");
const pluginTailwindcss = require("prettier-plugin-tailwindcss");

/** @type {import("prettier").Parser}  */
const combinedParser = {
  ...pluginImportSort.parsers.typescript,
  parse: pluginTailwindcss.parsers.typescript.parse,
};

/** @type {import("prettier").Plugin}  */
const combinedParserPlugin = {
  parsers: {
    typescript: combinedParser,
  },
};

const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  arrowParens: "avoid",
  printWidth: 100,
  plugins: [combinedParserPlugin],
};

module.exports = config;
