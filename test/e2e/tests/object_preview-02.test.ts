import { runClassicTest } from "../runTest";

it("Test that objects show up correctly in the scope pane.", async () => {
  await runClassicTest({
    example: "doc_rr_objects.html",
    script: "object_preview-02.js",
  });
});
