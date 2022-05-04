import { runClassicTest } from "../runTest";

it("Test basic breakpoint functionality.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "breakpoints-01.js",
  });
});
