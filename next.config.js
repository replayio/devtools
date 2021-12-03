const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");

const self = "'self' https://*.replay.io wss://*.replay.io";
const csp = `
  frame-ancestors ${self};
  default-src ${self};
  style-src ${self} 'unsafe-inline';
  script-src ${self} 'unsafe-eval' data: blob: https://*.stripe.com https://*.lr-ingest.io https://*.intercom.io https://*.intercomcdn.com https://*.launchdarkly.com;
  connect-src ${self} https://webreplay.us.auth0.com https://*.launchdarkly.com/ https://*.stripe.com https://*.intercom.io wss://*.intercom.io;
  img-src ${self} https: data:;
  frame-src ${self} https://webreplay.us.auth0.com https://*.stripe.com;
`;

module.exports = {
  productionBrowserSourceMaps: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: csp.split("\n").join(""),
          },
        ],
      },
    ];
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    const entry = config.entry;
    config.entry = () => {
      return entry().then(e => ({
        ...e,
        parserWorker: "./src/devtools/client/debugger/src/workers/parser/worker",
        searchWorker: "./src/devtools/client/debugger/src/workers/search/worker",
      }));
    };

    config.plugins.push(new RetryChunkLoadPlugin({ retryDelay: 1000, maxRetries: 2 }));

    // handles build error from webpack/runtime/compat
    // https://github.com/vercel/next.js/issues/25484
    if (isServer) {
      config.optimization.splitChunks = {
        cacheGroups: {
          commons: {
            name: "commons",
            chunks: "initial",
            minChunks: 20,
            priority: 20,
          },
        },
      };
    }

    config.resolve.fallback = {
      fs: false,
    };

    config.module.rules.push({
      test: /\.properties$/,
      loader: "raw-loader",
    });

    return config;
  },
};
