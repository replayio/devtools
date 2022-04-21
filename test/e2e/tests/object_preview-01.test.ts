import { runClassicTest } from "../runTest";

it("Test the objects produced by console.log() calls and by evaluating various expressions in the console after time warping.", async () => {
  await runClassicTest({
    example: "doc_rr_objects.html",
    script: "object_preview-01.js",
  });
});
