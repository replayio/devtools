import { runClassicTest } from "../runTest";

// Disabled because we can't record the example
// https://github.com/RecordReplay/node/issues/69
it.skip("loading napi modules works.", async () => {
  await runClassicTest({
    example: "node/napi.js",
    isNodeExample: true,
    script: "node_napi.js",
  });
});
