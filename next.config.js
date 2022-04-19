const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

module.exports = {
  eslint: {
    // which folders to run ESLint on during production builds (next build)
    dirs: ["src", "pages", "packages"],

    // We rely on Trunk's hold-the-line functionality.
    ignoreDuringBuilds: true,
  },

  // bumping Next from 12.0.9 to 12.1.0 required this as a temp WAR
  // (see https://github.com/vercel/next.js/pull/34500)
  experimental: {},

  async headers() {
    return [
      {
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.replay.io/; report-uri https://o437061.ingest.sentry.io/api/5399075/security/?sentry_key=41c20dff316f42fea692ef4f0d055261",
          },
        ],
        source: "/(.*)",
      },
    ];
  },

  productionBrowserSourceMaps: true,

  async redirects() {
    return [
      {
        destination: "/recording/:id",
        has: [
          {
            key: "id",
            type: "query",
          },
        ],
        permanent: true,
        source: "/view",
      },
      {
        destination: "/recording/:id",
        has: [
          {
            key: "id",
            type: "query",
          },
        ],
        permanent: true,
        source: "/",
      },
    ];
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const entry = config.entry;
    config.entry = () => {
      return entry().then(e => ({
        ...e,
        parserWorker: "./src/devtools/client/debugger/src/workers/parser/worker",
        searchWorker: "./src/devtools/client/debugger/src/workers/search/worker",
      }));
    };

    config.plugins.push(new RetryChunkLoadPlugin({ maxRetries: 2, retryDelay: 1000 }));

    // Check for circular imports and throw errors, but only if the
    // env variable is set.  Should only be true if manually defined
    // in a local dev environment.
    if (process.env.CHECK_CIRCULAR_IMPORTS) {
      const CircularDependencyPlugin = require("circular-dependency-plugin");

      config.plugins.push(
        new CircularDependencyPlugin({
          cwd: process.cwd(),
          exclude: /node_modules/,
          failOnError: true,
        })
      );
    }

    // handles build error from webpack/runtime/compat
    // https://github.com/vercel/next.js/issues/25484
    if (isServer) {
      config.optimization.splitChunks = {
        cacheGroups: {
          commons: {
            chunks: "initial",
            minChunks: 20,
            name: "commons",
            priority: 20,
          },
        },
      };
    }

    config.resolve.fallback = {
      fs: false,
    };

    config.module.rules.push({
      loader: "raw-loader",
      test: /\.properties$/,
    });

    config.module.rules.push({
      issuer: /\.[jt]sx?$/,
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};
