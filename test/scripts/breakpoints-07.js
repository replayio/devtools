Test.describe(`Test that breakpoints work across navigations.`, async () => {
  // this source is loaded twice, wait until the server has sent us both instances
  await Test.waitForSourceCount("bundle_input.js", 2);

  await Test.addBreakpoint("bundle_input.js", 5);
  await Test.rewindToLine(5);
  await Test.rewindToLine(5);
});
