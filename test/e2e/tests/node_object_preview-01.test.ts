import { runClassicTest } from "../runTest";

it("showing console objects in node.", async () => {
  await runClassicTest({
    example: "node/objects.js",
    isNodeExample: true,
    script: "node_object_preview-01.js",
  });
});
