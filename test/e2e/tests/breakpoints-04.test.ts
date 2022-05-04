import { runClassicTest } from "../runTest";

it("Test hitting breakpoints when using tricky control flow constructs: catch, finally, generators, and async/await.", async () => {
  await runClassicTest({
    example: "doc_control_flow.html",
    script: "breakpoints-04.js",
  });
});
