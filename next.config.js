module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const entry = config.entry;
    config.entry = () => {
      return entry().then(e => ({
        ...e,
        parserWorker: "./src/devtools/client/debugger/src/workers/parser/worker",
        searchWorker: "./src/devtools/client/debugger/src/workers/search/worker",
      }));
    };

    // handles build error from webpack/runtime/compat
    if (isServer) {
      config.optimization.splitChunks = {
        chunks: "async",
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    config.resolve.fallback = {
      fs: false,
    };

    // config.module.rules.push({
    //   test: /\.(j|t)sx?$/,
    //   exclude: request => {
    //     return (
    //       request.includes("node_modules") ||
    //       request.includes("src/devtools/client/shared/vendor") ||
    //       ["fs"].includes(request)
    //     );
    //   },
    // });
    // config.module.rules.push({
    //   test: /\.css$/i,
    //   exclude: /node_modules/,
    //   use: [
    //     // MiniCssExtractPlugin.loader,
    //     "style-loader",
    //     {
    //       loader: "css-loader",
    //       options: {
    //         importLoaders: 1,
    //         url: {
    //           filter: (url, resourcePath) => resourcePath.endsWith("/src/image/image.css"),
    //         },
    //       },
    //     },
    //     "postcss-loader",
    //   ],
    // });
    config.module.rules.push({
      test: /\.properties$/,
      loader: "raw-loader",
    });

    return config;
  },
};
