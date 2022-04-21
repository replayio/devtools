import { runClassicTest } from "../runTest";

it("Test autocomplete in the console.", async () => {
  await runClassicTest({
    example: "doc_rr_objects.html",
    script: "autocomplete.js",
  });
});
