import { runClassicTest } from "../runTest";

it("basic subprocess spawning.", async () => {
  await runClassicTest({
    example: "node/spawn.js",
    isNodeExample: true,
    script: "node_spawn-01.js",
  });
});
