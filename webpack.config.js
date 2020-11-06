const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    main: "./src/main",
    parserWorker: "./src/devtools/client/debugger/src/workers/parser/worker",
    searchWorker: "./src/devtools/client/debugger/src/workers/search/worker",
  },
  devtool: "source-map",
  output: {
    publicPath: "dist",
  },
  devServer: {
    before: app => {
      app.get("/view", (req, res) => {
        res.sendFile("index.html", { root: "." });
      });

      app.get("/test", (req, res) => {
        const testFile = req.url.substring(6);
        res.sendFile(testFile, { root: "./test/scripts" });
      });
    },
    contentBase: [".", "./src/image"],
    index: "index.html",
    liveReload: false,
    disableHostCheck: true,
  },
  plugins: [new MiniCssExtractPlugin()],
  resolve: {
    extensions: [".js", ".ts"],
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
        test: /\.(j|t)s$/,
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
              url: false,
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
