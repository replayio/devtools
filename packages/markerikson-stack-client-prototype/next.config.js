const transpileModules = require("next-transpile-modules");
const { patchWebpackConfig } = require("next-global-css");

const withTM = transpileModules(["protocol"]);

/**
 * @type {Pick<
 *   import('next').NextConfig,
 *   | 'webpack'
 * >}
 */
const baseNextConfig = {
  reactStrictMode: true,

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },

  /**
   * @type {(
   *   config: import('webpack').Configuration,
   *   context: {
   *     dev: boolean
   *     webpack: import('webpack')
   *   }
   * ) => import('webpack').Configuration}
   */
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Allow CSS imported from `node_modules`, to work around an error
    // from importing `<Expandable>` from Brian's protottype
    patchWebpackConfig(config, { isServer });

    return config;
  },
};

module.exports = withTM(baseNextConfig);
