module.exports = {
  reactStrictMode: true,
  transpilePackages: ["design", "use-context-menu"],

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },
};
