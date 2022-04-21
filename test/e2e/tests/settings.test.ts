import { runClassicTest } from "../runTest";

it("Test changing the user's settings.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "settings.js",
  });
});
