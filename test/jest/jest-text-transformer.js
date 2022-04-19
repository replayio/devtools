// Source: https://github.com/janouma/jest-text-transformer

const { statSync } = require("fs");

const uuid = require("uuid/v4");

const cache = {};

module.exports = {
  canInstrument: false,

  getCacheKey(fileData, filename) {
    const stat = statSync(filename);
    let cached = cache[filename];

    if (!cached) {
      cached = cache[filename] = {
        hash: uuid(),
        lastModified: stat.atimeMs,
      };
    }

    if (stat.atimeMs > cached.lastModified) {
      cache[filename] = {
        ...cached,
        hash: uuid(),
        lastModified: stat.atimeMs,
      };
    }

    return cached.hash;
  },

  process(src) {
    // console.log("Processing file: ", src);
    const escapedSrc = src.replace(/`/g, "\\`").replace(/\$(?=\{.*?\})/g, "\\$");

    return `module.exports.default = \`${escapedSrc}\``;
  },
};
