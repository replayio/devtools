const path = require("path");
const util = require("util");

module.exports = {
  stories: [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.tsx",
    "../packages/**/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "storybook-addon-root-attribute/register",
    "storybook-css-modules-preset",
    {
      name: "@storybook/addon-postcss",
      options: {
        postcssLoaderOptions: {
          implementation: require("postcss"),
        },
      },
    },
  ],
  core: {
    builder: "webpack5",
  },
  webpackFinal: async (config, { configType }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      components: path.resolve(__dirname, "../packages/components/index.ts"),
      icons: path.resolve(__dirname, "../packages/icons/index.tsx"),
      "@recordreplay/accordion": path.resolve(__dirname, "../packages/accordion/index.tsx"),
      "third-party": path.resolve(__dirname, "../packages/third-party"),
      "packages/third-party": path.resolve(__dirname, "../packages/third-party"),
      "replay-next": path.resolve(__dirname, "../packages/replay-next"),
    };

    config.resolve.modules = [
      "src",
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

    const existingBabelLoader = config.module.rules[0];

    config.module.rules = [
      {
        test: /\.properties$/,
        loader: "raw-loader",
      },
      ...config.module.rules,
      // Ensure that our homegrown "protocol" package gets compiled
      {
        ...existingBabelLoader,
        include: filePath => {
          const res = filePath.includes(`packages`);
          return res;
        },
        exclude: undefined,
      },
      {
        test: /\.(j|t)sx?$/,
        exclude: request => {
          const res =
            request.includes("node_modules") ||
            request.includes("src/devtools/client/shared/vendor") ||
            ["fs"].includes(request);

          return res;
        },
      },
    ];

    return config;
  },
};
