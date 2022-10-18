const withTM = require("next-transpile-modules");

module.exports = withTM(["../design"])({
  reactStrictMode: true,

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },

  compilerOptions: {
    paths: {
      "@codemirror/lang-javascript": "@codemirror/lang-javascript_bvaughn",
      "@codemirror/language": "@codemirror/language_bvaughn",
      "@codemirror/state": "@codemirror/state_bvaughn",
      "@lezer/common": "@lezer/common_bvaughn",
      "@lezer/highlight": "@lezer/highlight_bvaughn",
    },
  },
});
