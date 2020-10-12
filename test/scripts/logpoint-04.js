// Test exception logpoints.
(async function() {
  await Test.toggleExceptionLogging();
  await Test.selectConsole();

  await Test.warpToMessage("Object { number: 4 }");
  await Test.waitForFrameTimeline("50%");

  await Test.executeInConsole("number * 10");
  await Test.waitForMessage("40");

  await Test.reverseStepOverToLine(15);
  await Test.waitForFrameTimeline("0%");

  Test.finish();
})();
