import { runClassicTest } from "../runTest";

it("Test basic logpoint functionality. When logpoints are added, new messages should appear in the correct order and allow time warping.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "logpoint-01.js",
  });
});
