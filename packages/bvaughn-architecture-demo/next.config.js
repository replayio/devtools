const withTM = require("next-transpile-modules");

module.exports = withTM(["../design"])({
  reactStrictMode: true,

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },
});
