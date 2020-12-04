// Test basic step-over/back functionality.
(async function() {
  Test.start();
  await Test.addBreakpoint("doc_rr_basic.html", 20);

  await Test.rewindToLine(20);
  await Test.checkEvaluateInTopFrame("number", 10);
  await Test.reverseStepOverToLine(19);
  await Test.checkEvaluateInTopFrame("number", 9);
  await Test.checkEvaluateInTopFrame("dump(3)", `"Error: Evaluation failed"`);
  await Test.stepOverToLine(20);
  await Test.checkEvaluateInTopFrame("number", 10);

  Test.finish();
})();
