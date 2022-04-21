import { runClassicTest } from "../runTest";

it("Test stepping in blackboxed sources.", async () => {
  await runClassicTest({
    example: "doc_rr_blackbox.html",
    script: "stepping-04.js",
  });
});
