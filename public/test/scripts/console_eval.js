Test.describe(`Test global console evaluation.`, async () => {
  await Test.selectConsole();

  await Test.executeInConsole("number");
  await Test.waitForMessage("10");

  await Test.executeInConsole("window.updateNumber");
  await Test.waitForMessage("function updateNumber");
});
