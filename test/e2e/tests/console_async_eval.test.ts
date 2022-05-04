import { runClassicTest } from "../runTest";

it("Test global console evaluation in async frames.", async () => {
  await runClassicTest({
    example: "doc_async.html",
    script: "console_async_eval.js",
  });
});
