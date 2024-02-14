const { patchWebpackConfig } = require("next-global-css");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/**
 * @type {Pick<
 *   import('next').NextConfig,
 *   | 'webpack'
 *   | 'experimental'
 *   | 'eslint'
 *   | 'redirects'
 *   | 'productionBrowserSourceMaps'
 *   | 'headers'
 * >}
 */
const baseNextConfig = {
  eslint: {
    // which folders to run ESLint on during production builds (next build)
    dirs: ["src", "pages", "packages"],

    // We rely on Trunk's hold-the-line functionality.
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: true,

  async redirects() {
    return [
      {
        source: "/view",
        has: [
          {
            type: "query",
            key: "id",
          },
        ],
        destination: "/recording/:id",
        permanent: true,
      },
      {
        source: "/",
        has: [
          {
            type: "query",
            key: "id",
          },
        ],
        destination: "/recording/:id",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.replay.io/; report-to https://o437061.ingest.sentry.io/api/5399075/security/?sentry_key=41c20dff316f42fea692ef4f0d055261",
          },
        ],
        source: "/(.*)",
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
        source: "/_next/static/images/icon-sprite(.*)",
      },
    ];
  },

  /**
   * @type {(
   *   config: import('webpack').Configuration,
   *   context: {
   *     dev: boolean
   *     webpack: import('webpack')
   *     buildId: string
   *     dev: boolean
   *   }
   * ) => import('webpack').Configuration}
   */
  webpack: (config, { isServer, webpack }) => {
    // Slim down the Sentry bundle slightly:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/tree-shaking/
    config.plugins.push(
      new webpack.DefinePlugin({
        __SENTRY_DEBUG__: false,
        __SENTRY_TRACING__: false,
      })
    );

    // Allow CSS imported from `node_modules`, to work around an error
    // from importing `<Editor>` from `@redux-devtools/ui`
    patchWebpackConfig(config, { isServer });

    config.resolve.fallback = {
      fs: false,
    };

    const sourceMapRegExp =
      /node_modules.+(immer|@reduxjs|react-resizable-panels|react|react-dom|react-window|suspense|use-context-menu).+\.js$/;

    config.module.rules.push({
      test: sourceMapRegExp,
      enforce: "pre",
      use: ["source-map-loader"],
    });

    // JS files that need to be imported as strings,
    // such as the React DevTools backend to be injected into pauses
    config.module.rules.push({
      test: /\.raw\.*/,
      loader: "raw-loader",
    });

    config.module.rules.push({
      test: /\.svg$/i,
      exclude: resourcePath => resourcePath.includes("design/Icon/sprite.svg"),
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    /** Load the SVG sprite through NextJS so it can be cached. */
    config.module.rules.push({
      test: /\.svg$/i,
      include: resourcePath => resourcePath.includes("design/Icon/sprite.svg"),
      loader: "file-loader",
      options: {
        name: "icon-sprite.[contenthash].svg",
        publicPath: `/_next/static/images/`,
        outputPath: "static/images",
      },
    });

    return config;
  },
};

const plugins = [withBundleAnalyzer];

module.exports = (phase, defaultConfig) => {
  const config = plugins.reduce(
    (acc, plugin) => {
      const update = plugin(acc);
      return typeof update === "function" ? update(phase, defaultConfig) : update;
    },
    { ...baseNextConfig }
  );

  return config;
};
