import { runClassicTest } from "../runTest";

it("Test exception logpoints.", async () => {
  await runClassicTest({
    example: "node/exceptions.js",
    isNodeExample: true,
    script: "node_logpoint-02.js",
  });
});
