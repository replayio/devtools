Test.describe(`Test basic step-over/back functionality.`, async () => {
  await Test.addBreakpoint("doc_rr_basic.html", 20);

  await Test.rewindToLine(20);
  await Test.checkEvaluateInTopFrame("number", 10);
  await Test.reverseStepOverToLine(19);
  await Test.checkEvaluateInTopFrame("number", 9);
  await Test.stepOverToLine(20);
  await Test.checkEvaluateInTopFrame("number", 10);
});
