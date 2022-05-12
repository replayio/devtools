import { runClassicTest } from "../runTest";

it("Test React DevTools.", async () => {
  await runClassicTest({
    example: "cra/dist/index.html",
    script: "react_devtools.js",
  });
});
