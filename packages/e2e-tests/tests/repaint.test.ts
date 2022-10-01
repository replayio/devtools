// Test that the screen is repainted when stepping over code that modifies the DOM
Test.describe(`repainting.`, async () => {
  await Test.addBreakpoint("doc_control_flow.html", 50);
  await Test.rewindToLine(50);
  let hash = window.currentScreenshotHash;
  await Test.stepOverAndPause();
  await Test.waitUntil(() => window.currentScreenshotHash !== hash, { waitingFor: "the screenshot to change" });
});
