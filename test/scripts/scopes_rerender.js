Test.describe(`Test that scopes are rerendered.`, async () => {
  await Test.selectConsole();

  await Test.warpToMessage("Hello 1");
  await Test.waitForScopeValue("n", "1");

  await Test.selectFrame(2);
  await Test.waitForScopeValue("n", "3");

  await Test.selectFrame(0);
  await Test.waitForScopeValue("n", "1");
});
