Test.describe(`Test previews when switching between frames and stepping.`, async () => {
  await Test.addBreakpoint("doc_rr_preview.html", 17);
  await Test.rewindToLine(17);

  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.findScopeNode("barprop2");
  await Test.waitForScopeValue("barprop1", "2");

  await Test.waitForFrameTimeline("42%");

  await Test.checkFrames(2);
  await Test.selectFrame(1);

  await Test.toggleScopeNode("fooobj");
  await Test.findScopeNode("fooprop1");
  await Test.findScopeNode("fooprop2");

  await Test.selectFrame(0);

  //await Test.waitForInstantStep("stepOver");
  await Test.stepOverToLine(18);

  await Test.waitForFrameTimeline("71%");

  // barobj is already expanded.
  await Test.findScopeNode("barprop1");
  await Test.waitForScopeValue("barprop1", `"updated"`);

  //await Test.waitForInstantStep("reverseStepOver");
  await Test.reverseStepOverToLine(17);

  // barobj is already expanded.
  await Test.findScopeNode("barprop1");
  await Test.waitForScopeValue("barprop1", "2");

  //await Test.waitForInstantStep("stepIn");
  await Test.stepInToLine(21);

  //await Test.waitForInstantStep("stepOver");
  await Test.stepOverToLine(22);

  await Test.waitForFrameTimeline("50%");

  await Test.checkFrames(3);

  await Test.selectFrame(1);
  await Test.waitForFrameTimeline("57%");

  await Test.selectFrame(2);
  await Test.waitForFrameTimeline("66%");
});
