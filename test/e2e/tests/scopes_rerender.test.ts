import { runClassicTest } from "../runTest";

it("Test that scopes are rerendered.", async () => {
  await runClassicTest({
    example: "doc_recursion.html",
    script: "scopes_rerender.js",
  });
});
