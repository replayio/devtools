const path = require("path");

module.exports = {
  context: __dirname,
  entry: "./bundle_input.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "../..")
  },
  devtool: "source-map",
  mode: "development"
};

