const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

module.exports = {
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
        source: "/(.*)",
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

    config.plugins.push(new RetryChunkLoadPlugin({ retryDelay: 1000, maxRetries: 2 }));

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

    config.module.rules.push({
      test: /\.properties$/,
      loader: "raw-loader",
    });

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};
