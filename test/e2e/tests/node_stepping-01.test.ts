import { runClassicTest } from "../runTest";

it("Test stepping in async frames and async call stacks.", async () => {
  await runClassicTest({
    example: "node/async.js",
    isNodeExample: true,
    script: "node_stepping-01.js",
  });
});
