import { runClassicTest } from "../runTest";

it("basic node console behavior.", async () => {
  await runClassicTest({
    example: "node/basic.js",
    isNodeExample: true,
    script: "node_console-01.js",
  });
});
