const transpileModules = require("next-transpile-modules");

const withTM = transpileModules(["protocol"]);

const baseNextConfig = {
  reactStrictMode: true,

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },
};

module.exports = withTM(baseNextConfig);
