import { runClassicTest } from "../runTest";

it("Test basic step-over/back functionality.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "stepping-01.js",
  });
});
