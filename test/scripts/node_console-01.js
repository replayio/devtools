Test.describe(`basic node console behavior.`, async () => {
  await Test.selectConsole();

  await Test.warpToMessage("HELLO 1");

  await Test.selectDebugger();
  await Test.checkEvaluateInTopFrame("num", 1);
  await Test.waitForScopeValue("num", "1");
  await Test.reverseStepOverToLine(4);
});
