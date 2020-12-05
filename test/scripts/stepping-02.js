Test.describe(`Test fixes for some simple stepping bugs.`, async () => {
  await Test.addBreakpoint("doc_rr_basic.html", 21);

  await Test.rewindToLine(21);
  await Test.stepInToLine(24);
  await Test.stepOverToLine(25);
  await Test.stepOverToLine(26);
  await Test.reverseStepOverToLine(25);
  await Test.stepInToLine(29);
  await Test.stepOverToLine(30);
  await Test.stepOverToLine(31);

  // Check that the scopes pane shows the value of the local variable.
  await Test.waitForScopeValue("c", "NaN");

  await Test.stepOverToLine(32);
  await Test.reverseStepOverToLine(31);
  await Test.stepOutToLine(26);
  await Test.reverseStepOverToLine(25);
  await Test.reverseStepOverToLine(24);
});
