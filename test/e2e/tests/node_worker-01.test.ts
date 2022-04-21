import { runClassicTest } from "../runTest";

it("make sure node workers don't cause crashes.", async () => {
  await runClassicTest({
    example: "node/run_worker.js",
    isNodeExample: true,
    script: "node_worker-01.js",
  });
});
