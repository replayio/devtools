const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  entry: "./src/main",
  devtool: "source-map",
  output: {
    publicPath: 'dist',
  },
  devServer: {
    contentBase: '.',
    index: 'index.html',
    liveReload: false
  },
  plugins: [new MiniCssExtractPlugin()],
  resolve: {
    modules: [
      "src",
      "src/devtools/client/debugger/dist",
      "src/devtools/client/shared/sourceeditor",
      "src/devtools/client/shared/sourceeditor/codemirror/lib",
      "src/devtools/client/shared/vendor",
      "node_modules",
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: (request) => {
          return (
            request.includes("node_modules") ||
            request.includes("src/devtools/client/shared/vendor") ||
            ["fs"].includes(request)
          );
        },
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
            plugins: [
              "@babel/plugin-transform-flow-strip-types",
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-optional-chaining"
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
        use: [{
          loader: "url-loader",
        }],
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
