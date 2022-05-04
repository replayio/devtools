import { runClassicTest } from "../runTest";

it("Test global console evaluation.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "console_eval.js",
  });
});
