import { runClassicTest } from "../runTest";

it("Test previews when switching between frames and stepping.", async () => {
  await runClassicTest({
    example: "doc_rr_preview.html",
    script: "object_preview-03.js",
  });
});
