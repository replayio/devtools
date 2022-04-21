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
        lastModified: stat.atimeMs,
        hash: uuid(),
      };
    }

    if (stat.atimeMs > cached.lastModified) {
      cache[filename] = {
        ...cached,
        lastModified: stat.atimeMs,
        hash: uuid(),
      };
    }

    return cached.hash;
  },

  process(src) {
    // console.log("Processing file: ", src);
    const escapedSrc = src.replace(/`/g, "\\`").replace(/\$(?=\{.*?\})/g, "\\$");

    return { code: `module.exports.default = \`${escapedSrc}\`` };
  },
};
