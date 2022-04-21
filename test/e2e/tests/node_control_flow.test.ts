import { runClassicTest } from "../runTest";

it("Test hitting breakpoints when using tricky control flow constructs: catch, finally, generators, and async/await.", async () => {
  await runClassicTest({
    example: "node/control_flow.js",
    isNodeExample: true,
    script: "node_control_flow.js",
  });
});
