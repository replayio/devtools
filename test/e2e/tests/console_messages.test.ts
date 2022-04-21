import { runClassicTest } from "../runTest";

it("Test expanding console objects that were logged by console messages, logpoints, and evaluations when the debugger is somewhere else.", async () => {
  await runClassicTest({
    example: "doc_rr_console.html",
    script: "console_messages.js",
  });
});
