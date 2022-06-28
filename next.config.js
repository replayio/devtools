const { patchWebpackConfig } = require("next-global-css");
const transpileModules = require("next-transpile-modules");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");
const withPlugins = require("next-compose-plugins");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withTM = transpileModules(["bvaughn-architecture-demo"]);

const baseNextConfig = {
  // bumping Next from 12.0.9 to 12.1.0 required this as a temp WAR
  // (see https://github.com/vercel/next.js/pull/34500)
  experimental: {
    browsersListForSwc: true,
  },

  eslint: {
    // which folders to run ESLint on during production builds (next build)
    dirs: ["src", "pages", "packages"],

    // We rely on Trunk's hold-the-line functionality.
    ignoreDuringBuilds: true,
  },

  productionBrowserSourceMaps: true,

  async redirects() {
    return [
      {
        source: "/view",
        has: [
          {
            type: "query",
            key: "id",
          },
        ],
        destination: "/recording/:id",
        permanent: true,
      },
      {
        source: "/",
        has: [
          {
            type: "query",
            key: "id",
          },
        ],
        destination: "/recording/:id",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.replay.io/; report-to https://o437061.ingest.sentry.io/api/5399075/security/?sentry_key=41c20dff316f42fea692ef4f0d055261",
          },
        ],
        source: "/(.*)",
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

    // Check for circular imports and throw errors, but only if the
    // env variable is set.  Should only be true if manually defined
    // in a local dev environment.
    if (process.env.CHECK_CIRCULAR_IMPORTS) {
      const CircularDependencyPlugin = require("circular-dependency-plugin");

      let numCyclesDetected = 0;

      config.plugins.push(
        new CircularDependencyPlugin({
          exclude: /node_modules/,
          failOnError: true,
          cwd: process.cwd(),
          allowAsyncCycles: true,
          onStart({ compilation }) {
            numCyclesDetected = 0;
          },
          onDetected({ module: webpackModuleRecord, paths, compilation }) {
            numCyclesDetected++;
            compilation.warnings.push(new Error(paths.join(" -> ")));
          },
          onEnd({ compilation }) {
            if (numCyclesDetected > 0) {
              compilation.warnings.push(new Error(`Detected ${numCyclesDetected} cycles`));
            }
          },
        })
      );
    }

    // Allow CSS imported from `node_modules`, to work around an error
    // from importing `<Editor>` from `@redux-devtools/ui`
    patchWebpackConfig(config, { isServer });

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

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = withPlugins([withTM, withBundleAnalyzer], baseNextConfig);
