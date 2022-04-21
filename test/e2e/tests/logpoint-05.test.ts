import { runClassicTest } from "../runTest";

it("Test basic logpoint functionality.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "logpoint-05.js",
  });
});
