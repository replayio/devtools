const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Visualizer = require("webpack-visualizer-plugin2");
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
    filename: "[name].[fullhash].js",
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
    new NodePolyfillPlugin(),
    new HtmlWebpackPlugin({ template: "index.html", chunks: ["main"] }),
    process.env.REPLAY_BUILD_VISUALIZE && new Visualizer(),
    new webpack.EnvironmentPlugin({
      REPLAY_RELEASE: null,
      API_URL: "https://api.replay.io/v1/graphql",
    }),
    new CopyPlugin({
      patterns: [
        { from: "vercel.json" },
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
              "add-react-displayname",
              "@babel/plugin-transform-flow-strip-types",
              "@babel/plugin-transform-react-display-name",
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-logical-assignment-operators",
              "@babel/plugin-proposal-nullish-coalescing-operator",
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
              url: {
                filter: (url, resourcePath) => resourcePath.endsWith("/src/image/image.css"),
              },
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
        type: "asset/inline",
      },
    ],
  },
  externals: [
    function ({ context, request }, callback) {
      if (/^fs$/.test(request)) {
        return callback(null, "{}");
      }
      callback();
    },
  ],
};
