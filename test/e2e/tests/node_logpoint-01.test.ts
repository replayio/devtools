import { runClassicTest } from "../runTest";

it("basic node logpoints.", async () => {
  await runClassicTest({
    example: "node/basic.js",
    isNodeExample: true,
    script: "node_logpoint-01.js",
  });
});
