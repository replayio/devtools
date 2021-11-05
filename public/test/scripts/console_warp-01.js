Test.describe(`Test basic console time warping functionality.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("Number 5");

  await Test.selectDebugger();
  await Test.checkEvaluateInTopFrame("number", 5);

  const target = await Test.getRecordingTarget();
  if (target == "gecko") {
    // Initially we are paused inside the 'new Error()' call on line 19. The
    // first reverse step takes us to the start of that line.
    await Test.reverseStepOverToLine(19);
  }

  await Test.reverseStepOverToLine(18);
  await Test.addBreakpoint("doc_rr_error.html", 12);
  await Test.rewindToLine(12);
  await Test.checkEvaluateInTopFrame("number", 4);
  await Test.resumeToLine(12);
  await Test.checkEvaluateInTopFrame("number", 5);

  // This error message has different text on gecko vs. chromium.
  const errorText = (target == "gecko")
    ? "window.foo is undefined"
    : "Cannot set property 'bar' of undefined";
  await Test.warpToMessage(errorText);
  await Test.reverseStepOverToLine(7);

  await Test.warpToMessage("superclass");

  if (target == "gecko") {
    // As above, we need an additional reverse step over in gecko.
    await Test.reverseStepOverToLine(40);
  }

  await Test.reverseStepOverToLine(39);
});
