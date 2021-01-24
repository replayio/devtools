Test.describe(`basic subprocess spawning.`, async () => {
  await Test.selectConsole();

  await Test.warpToMessage("sync 2");
  await Test.checkEvaluateInTopFrame("n", 2);

  await Test.warpToMessage("async 5");
  await Test.checkEvaluateInTopFrame("i", 5);
});
