module.exports = {
  reactStrictMode: true,
  transpilePackages: ["design"],

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },
  // TODO(mbudayr): dev only addition, remove later.
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};
