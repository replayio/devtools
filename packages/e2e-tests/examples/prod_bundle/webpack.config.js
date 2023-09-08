const path = require("path");

module.exports = {
  context: __dirname,
  entry: "./bundle_input.js",
  output: {
    filename: "prod_bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devtool: "source-map",
  mode: "production",
};
