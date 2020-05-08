module.exports = {
  mode: "development",
  entry: "./src/main",
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
          return request.includes("node_modules") || ["fs"].includes(request);
        },
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
            plugins: [
              "@babel/plugin-transform-flow-strip-types",
              "@babel/plugin-proposal-class-properties",
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.properties$/,
        loader: "raw-loader",
      },
    ],
  },
};
