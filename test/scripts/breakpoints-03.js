// Test hitting breakpoints when rewinding past the point where the breakpoint
// script was created.
(async function() {
  await Test.rewindToLine(undefined);

  await Test.addBreakpoint("doc_rr_basic.html", 21);
  await Test.resumeToLine(21);
  await Test.checkEvaluateInTopFrame("number", 1);
  await Test.resumeToLine(21);
  await Test.checkEvaluateInTopFrame("number", 2);

  Test.finish();
})();
