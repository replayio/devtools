Test.describe(`Test scope mapping and switching between generated/original sources.`, async () => {
  await Test.addBreakpoint("bundle_input.js", 15, undefined, {
    logValue: "barobj.barprop1 * 10",
  });

  await Test.warpToMessage("20");
  await Test.waitForPausedLine(15);
  await Test.waitForScopeValue("bar");
  await Test.waitForScopeValue("bararr", "Array(3) […]");
  await Test.waitForScopeValue("barobj", "{…}");
  await Test.executeInConsole("bararr.length * 100");
  await Test.waitForMessage("300");

  await Test.toggleMappedSources();
  await Test.waitForPausedLine(58);
  await Test.waitForScopeValue("n", "Array(3) […]");
  await Test.waitForScopeValue("e", "{…}");
});
