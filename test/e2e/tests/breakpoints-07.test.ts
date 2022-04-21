import { runClassicTest } from "../runTest";

it("Test that breakpoints work across navigations.", async () => {
  await runClassicTest({
    example: "doc_navigate.html",
    script: "breakpoints-07.js",
  });
});
