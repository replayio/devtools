// Test basic console time warping functionality.
(async function () {
  await Test.start();
  await Test.selectConsole();
  await Test.warpToMessage("Number 5");

  await Test.selectDebugger();
  await Test.checkEvaluateInTopFrame("number", 5);

  // Initially we are paused inside the 'new Error()' call on line 19. The
  // first reverse step takes us to the start of that line.
  await Test.reverseStepOverToLine(19);
  await Test.reverseStepOverToLine(18);
  await Test.addBreakpoint("doc_rr_error.html", 12);
  await Test.rewindToLine(12);
  await Test.checkEvaluateInTopFrame("number", 4);
  await Test.resumeToLine(12);
  await Test.checkEvaluateInTopFrame("number", 5);

  await Test.warpToMessage("window.foo is undefined");
  await Test.reverseStepOverToLine(7);

  Test.finish();
})();
