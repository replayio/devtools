Test.describe(`Test basic console time warping functionality.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("Number 5");

  await Test.selectDebugger();
  await Test.checkEvaluateInTopFrame("number", 5);

  // Unlike gecko, the first reverse-step takes us to the line before the error.
  await Test.reverseStepOverToLine(18);
  await Test.addBreakpoint("doc_rr_error.html", 12);
  await Test.rewindToLine(12);
  await Test.checkEvaluateInTopFrame("number", 4);
  await Test.resumeToLine(12);
  await Test.checkEvaluateInTopFrame("number", 5);

  // This error has a different message in chromium.
  await Test.warpToMessage("Cannot set property 'bar' of undefined");
  await Test.reverseStepOverToLine(7);

  await Test.warpToMessage("superclass");

  // As above, reverse-stepping goes to a different line in chromium.
  await Test.reverseStepOverToLine(39);
});
