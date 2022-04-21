import { runClassicTest } from "../runTest";

it("Test that workers function when recording/replaying. For now workers can't be inspected, so we're making sure that nothing crashes.", async () => {
  await runClassicTest({
    example: "doc_rr_worker.html",
    script: "worker-01.js",
  });
});
