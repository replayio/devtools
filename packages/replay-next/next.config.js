const withTM = require("next-transpile-modules");

module.exports = withTM(["design"])({
  reactStrictMode: true,

  // This setting allows the Next app to import code from e.g. "packages/protocol"
  experimental: {
    externalDir: true,
  },

  compilerOptions: {
    paths: {
      "@codemirror/lang-javascript": "@codemirror/lang-javascript_replay_next",
      "@codemirror/language": "@codemirror/language_replay_next",
      "@codemirror/state": "@codemirror/state_replay_next",
      "@lezer/common": "@lezer/common_replay_next",
      "@lezer/highlight": "@lezer/highlight_replay_next",
    },
  },
});
