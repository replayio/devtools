const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

module.exports = {
  productionBrowserSourceMaps: true,
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
      test: /^\/test\//,
      loader: "raw-loader",
    });

    return config;
  },
};
