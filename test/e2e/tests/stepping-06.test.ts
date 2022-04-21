import { runClassicTest } from "../runTest";

it("Test stepping in async frames and async call stacks.", async () => {
  await runClassicTest({
    example: "doc_async.html",
    script: "stepping-06.js",
  });
});
