Test.describe(`Test global console evaluation.`, async () => {
  await Test.selectConsole();

  await Test.app.actions.seekToTime(1570)
  await Test.executeInConsole("333");
  await Test.warpToMessage("ExampleFinished");

  await Test.executeInConsole("number");
  await Test.waitForMessage("10");

  await Test.executeInConsole("window.updateNumber");
  await Test.waitForMessage("function updateNumber");
});
