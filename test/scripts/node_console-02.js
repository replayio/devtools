Test.describe(`uncaught exceptions should show up.`, async () => {
  await Test.selectConsole();
  await Test.warpToMessage("ReferenceError: b is not defined");
  await Test.waitForPausedLine(2);
  await Test.reverseStepOverToLine(4);
});
