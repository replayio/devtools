const { patchWebpackConfig } = require("next-global-css");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

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
  typescript: {
    ignoreBuildErrors: true
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
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const entry = config.entry;
    config.entry = () => {
      return entry().then(e => ({
        ...e,
        parserWorker: "./src/devtools/client/debugger/src/workers/parser/worker",
        searchWorker: "./src/devtools/client/debugger/src/workers/search/worker",
      }));
    };

    config.plugins.push(new RetryChunkLoadPlugin({ retryDelay: 1000, maxRetries: 2 }));

    // Check for circular imports and throw errors, but only if the
    // env variable is set.  Should only be true if manually defined
    // in a local dev environment.
    if (process.env.CHECK_CIRCULAR_IMPORTS) {
      const CircularDependencyPlugin = require("circular-dependency-plugin");

      let numCyclesDetected = 0;

      config.plugins.push(
        new CircularDependencyPlugin({
          exclude: /node_modules/,
          failOnError: true,
          cwd: process.cwd(),
          allowAsyncCycles: true,
          onStart({ compilation }) {
            numCyclesDetected = 0;
          },
          onDetected({ module: webpackModuleRecord, paths, compilation }) {
            numCyclesDetected++;
            compilation.warnings.push(new Error(paths.join(" -> ")));
          },
          onEnd({ compilation }) {
            if (numCyclesDetected > 0) {
              compilation.warnings.push(new Error(`Detected ${numCyclesDetected} cycles`));
            }
          },
        })
      );
    }

    // Allow CSS imported from `node_modules`, to work around an error
    // from importing `<Editor>` from `@redux-devtools/ui`
    patchWebpackConfig(config, { isServer });

    // handles build error from webpack/runtime/compat
    // https://github.com/vercel/next.js/issues/25484
    if (isServer) {
      config.optimization.splitChunks = {
        cacheGroups: {
          commons: {
            name: "commons",
            chunks: "initial",
            minChunks: 20,
            priority: 20,
          },
        },
      };
    }

    config.resolve.fallback = {
      fs: false,
    };

    const reLibrariesWithSourcemaps = /node_modules.+(immer|@reduxjs|react-window).+\.js$/;

    config.module.rules.push({
      test: reLibrariesWithSourcemaps,
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
