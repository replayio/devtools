module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-postcss",
    "storybook-addon-root-attribute/register",
    "storybook-css-modules-preset",
  ],
  options: {
    postcssLoaderOptions: {
      implementation: require("postcss"),
    },
  },
  core: {
    builder: "webpack5",
  },

  webpackFinal: async (config, { configType }) => {
    config.resolve.modules = [
      "src",
      "src/devtools/client/debugger/dist",
      "src/devtools/client/debugger/packages",
      "src/devtools/client/shared/vendor",
      ...config.resolve.modules,
    ];

    config.externals = [
      ...(config.externals || []),
      function ({ context, request }, callback) {
        if (/^fs$/.test(request)) {
          return callback(null, "{}");
        }
        callback();
      },
    ];

    config.module.rules = [
      {
        test: /\.properties$/,
        loader: "raw-loader",
      },
      {
        test: /\.(j|t)sx?$/,
        exclude: request => {
          return (
            request.includes("node_modules") ||
            request.includes("src/devtools/client/shared/vendor") ||
            ["fs"].includes(request)
          );
        },
      },
      ...config.module.rules,
    ];

    return config;
  },
};
