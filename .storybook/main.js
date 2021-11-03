module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-postcss",
    "storybook-addon-root-attribute/register",
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
      // "node_modules",
      ...config.resolve.modules,
    ];

    // const cssIndex = config.module.rules.findIndex(r => r.test.toString().match(/css/));
    // config.module.rules.splice(cssIndex, 1);

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
      // {
      //   test: /\.css$/,
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
      // },
      ...config.module.rules,
    ];

    return config;
  },
};
