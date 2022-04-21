import { runClassicTest } from "../runTest";

it("Test exception logpoints.", async () => {
  await runClassicTest({
    example: "doc_exceptions.html",
    script: "logpoint-04.js",
  });
});
