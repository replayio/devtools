const path = require("path");
const merge = require("merge-deep");

module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
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
