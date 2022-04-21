import { runClassicTest } from "../runTest";

it("Test fixes for some simple stepping bugs.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "stepping-02.js",
  });
});
