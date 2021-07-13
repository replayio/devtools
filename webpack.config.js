const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const Visualizer = require("webpack-visualizer-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

module.exports = {
  entry: {
    main: "./src/main",
    parserWorker: "./src/devtools/client/debugger/src/workers/parser/worker",
    searchWorker: "./src/devtools/client/debugger/src/workers/search/worker",
  },
  devtool: "source-map",
  output: {
    publicPath: "/",
    filename: "[name].js?v=[contenthash]",
  },
  devServer: {
    before: app => {
      app.get("/test", (req, res) => {
        const testFile = req.url.substring(6);
        res.sendFile(testFile, { root: "./test/scripts" });
      });
    },
    contentBase: [".", "./src/image"],
    index: "index.html",
    liveReload: false,
    disableHostCheck: true,
    historyApiFallback: {
      rewrites: [
        {
          from: /\/(dist|images)\//,
          to: function (context) {
            return context.parsedUrl.pathname.replace(/.*(\/(dist|images)\/.*)/, "$1");
          },
        },
      ],
    },
  },
  plugins: [
    new MiniCssExtractPlugin(),
    process.env.REPLAY_BUILD_VISUALIZE && new Visualizer(),
    new webpack.EnvironmentPlugin({ REPLAY_RELEASE: undefined }),
    new CopyPlugin({
      patterns: [
        { from: "vercel.json" },
        { from: "index.html" },
        { from: "favicon.svg" },
        { from: "src/image/images", to: "images" },
      ],
    }),
    new RetryChunkLoadPlugin({ retryDelay: 1000, maxRetries: 2 }),
  ].filter(Boolean),
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    modules: [
      "src",
      "src/devtools/client/debugger/dist",
      "src/devtools/client/debugger/packages",
      "src/devtools/client/shared/vendor",
      "node_modules",
    ],
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: request => {
          return (
            request.includes("node_modules") ||
            request.includes("src/devtools/client/shared/vendor") ||
            ["fs"].includes(request)
          );
        },
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-typescript", "@babel/preset-react"],
            plugins: [
              "@babel/plugin-transform-flow-strip-types",
              "@babel/plugin-transform-react-display-name",
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-optional-chaining",
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          // MiniCssExtractPlugin.loader,
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              url: (url, resourcePath) => resourcePath.endsWith("/src/image/image.css"),
            },
          },
          "postcss-loader",
        ],
      },
      {
        test: /\.properties$/,
        loader: "raw-loader",
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "url-loader",
          },
        ],
      },
    ],
  },
  externals: [
    function (context, request, callback) {
      if (/^fs$/.test(request)) {
        return callback(null, "{}");
      }
      callback();
    },
  ],
};
