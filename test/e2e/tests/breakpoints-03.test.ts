import { runClassicTest } from "../runTest";

it("Test hitting breakpoints when rewinding past the point where the breakpoint.", async () => {
  await runClassicTest({
    example: "doc_rr_basic.html",
    script: "breakpoints-03.js",
  });
});
