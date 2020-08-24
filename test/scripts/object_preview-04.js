// Make sure that previews work as expected when using source maps.
(async function() {
  await Test.addBreakpoint("bundle_input.js", 16);
  await Test.rewindToLine(16, /* waitForLine */ true);

  await Test.checkInlinePreview("barobj", "Object { barprop1: 2, barprop2: 3, nested: {…} }");
  await Test.checkInlinePreview("bararr", "Array(2) [ 5, 6 ]");

  //await Test.waitForInstantStep("stepOver");
  await Test.stepOverToLine(17);

  await Test.checkInlinePreview("bararr", 'Array(3) [ 5, 6, "new" ]');

  //await Test.waitForInstantStep("reverseStepOver");
  await Test.reverseStepOverToLine(16);

  await Test.checkInlinePreview("bararr", "Array(2) [ 5, 6 ]");

  Test.finish();
})();
