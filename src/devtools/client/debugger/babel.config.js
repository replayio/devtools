/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

/**
 * NOTE: This file does not apply to builds in MC. This config is used for
 * our Jest tests and for webpack bundle builds.
 */
module.exports = {
  sourceType: "unambiguous",
  overrides: [
    {
      test: [
        "./src",
        "./packages/*/index.js",
        "./packages/*/src",
        /[/\\]node_modules[/\\]devtools-/,
        /[/\\]node_modules[/\\]react-aria-components[/\\]/,
      ],
      presets: [
        "@babel/preset-typescript",
        "@babel/preset-react",
        [
          "@babel/preset-env",
          {
            targets: {
              browsers: ["last 1 Chrome version", "last 1 Firefox version"],
            },
            modules: "commonjs",
          },
        ],
      ],
      plugins: [
        "add-react-displayname",
        "@babel/plugin-transform-flow-strip-types",
        "@babel/plugin-proposal-class-properties",
        [
          "module-resolver",
          {
            alias: {
              // Map all require("devtools/...") to the real devtools root.
              "^devtools\\/(.*)": `${__dirname}/../../\\1`,
              "devtools-services": `${__dirname}/dist/devtools-services.js`,
              "devtools-modules": `${__dirname}/dist/devtools-modules`,
              "devtools-environment": `${__dirname}/dist/devtools-environment`,
              "devtools-utils/src/worker-utils": `${__dirname}/packages/devtools-utils/src/worker-utils`,
              "^protocol\\/(.*)": `${__dirname}/../../../protocol/\\1`,
            },
          },
        ],
      ],
      env: {
        test: {
          presets: [
            [
              "@babel/preset-env",
              {
                targets: {
                  node: 7,
                },
                modules: "commonjs",
              },
            ],
          ],
        },
      },
    },
  ],
};
