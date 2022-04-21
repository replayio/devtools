import { runClassicTest } from "../runTest";

it("uncaught exceptions should show up.", async () => {
  await runClassicTest({
    example: "node/error.js",
    isNodeExample: true,
    script: "node_console-02.js",
  });
});
