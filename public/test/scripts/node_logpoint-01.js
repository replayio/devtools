Test.describe(`basic node logpoints.`, async () => {
  await Test.selectConsole();

  await Test.selectSource("basic.js");
  await Test.addBreakpoint("basic.js", 4, undefined, {
    logValue: `"CALL", i`,
  });

  await Test.warpToMessage("CALL 2");
  await Test.checkEvaluateInTopFrame("i", 2);

  await Test.reverseStepOverToLine(3);
});
