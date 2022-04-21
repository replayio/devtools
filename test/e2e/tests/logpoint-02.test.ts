import { runClassicTest } from "../runTest";

it("Test that logpoints appear and disappear as expected as breakpoints are modified. Also test that conditional logpoints work.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "logpoint-02.js",
  });
});
