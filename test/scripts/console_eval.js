// Test global console evaluation.
(async function () {
  await Test.start();
  await Test.selectConsole();

  await Test.executeInConsole("number");
  await Test.waitForMessage("10");

  await Test.executeInConsole("window.updateNumber");
  await Test.waitForMessage("function updateNumber");

  Test.finish();
})();
