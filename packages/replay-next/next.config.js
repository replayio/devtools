module.exports = {
  reactStrictMode: true,
  transpilePackages: ["design"],

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },
};
