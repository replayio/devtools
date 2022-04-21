import { runClassicTest } from "../runTest";

it("Stepping past the beginning or end of a frame should act like a step-out.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "stepping-03.js",
  });
});
