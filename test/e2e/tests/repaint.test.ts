import { runClassicTest } from "../runTest";

it("Test that the screen is repainted when stepping over code that modifies the DOM repainting.", async () => {
  await runClassicTest({
    example: "doc_control_flow.html",
    script: "repaint.js",
  });
});
