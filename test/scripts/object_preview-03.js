// Test previews when switching between frames and stepping.
(async function () {
  await Test.addBreakpoint("doc_rr_preview.html", 17);
  await Test.rewindToLine(17);

  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.findScopeNode("barprop2");
  await Test.waitForScopeValue("barprop1", "2");

  await Test.checkInlinePreview("bararr", "Array(2) [ 5, 6 ]");
  await Test.waitForFrameTimeline("28%");

  await Test.checkFrames(2);
  await Test.selectFrame(1);

  await Test.toggleScopeNode("fooobj");
  await Test.findScopeNode("fooprop1");
  await Test.findScopeNode("fooprop2");

  await Test.selectFrame(0);

  //await Test.waitForInstantStep("stepOver");
  await Test.stepOverToLine(18);

  await Test.checkInlinePreview("bararr", 'Array(3) [ 5, 6, "new" ]');
  await Test.waitForFrameTimeline("57%");

  // barobj is already expanded.
  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.waitForScopeValue("barprop1", `"updated"`);

  //await Test.waitForInstantStep("reverseStepOver");
  await Test.reverseStepOverToLine(17);

  await Test.checkInlinePreview("bararr", "Array(2) [ 5, 6 ]");

  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.waitForScopeValue("barprop1", "2");

  //await Test.waitForInstantStep("stepIn");
  await Test.stepInToLine(21);

  //await Test.waitForInstantStep("stepOver");
  await Test.stepOverToLine(22);

  await Test.waitForFrameTimeline("25%");

  await Test.checkFrames(3);

  await Test.selectFrame(1);
  await Test.waitForFrameTimeline("57%");

  await Test.selectFrame(2);
  await Test.waitForFrameTimeline("66%");

  Test.finish();
})();
