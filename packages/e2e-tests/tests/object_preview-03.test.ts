Test.describe(`Test previews when switching between frames and stepping.`, async () => {
  // Because stepping works differently between gecko and chromium, frame timeline
  // percentages are different in this test.
  const target = await Test.getRecordingTarget();

  await Test.addBreakpoint("doc_rr_preview.html", 17);
  await Test.rewindToLine(17);

  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.findScopeNode("barprop2");
  await Test.waitForScopeValue("barprop1", "2");

  await Test.waitForFrameTimeline(target == "gecko" ? "42%" : "75%");

  await Test.checkFrames(2);
  await Test.selectFrame(1);

  await Test.toggleScopeNode("fooobj");
  await Test.findScopeNode("fooprop1");
  await Test.findScopeNode("fooprop2");

  await Test.selectFrame(0);

  await Test.stepOverToLine(18);

  await Test.waitForFrameTimeline(target == "gecko" ? "71%" : "100%");

  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.waitForScopeValue("barprop1", `"updated"`);

  await Test.reverseStepOverToLine(17);

  await Test.toggleScopeNode("barobj");
  await Test.findScopeNode("barprop1");
  await Test.waitForScopeValue("barprop1", "2");

  await Test.stepInToLine(21);

  await Test.stepOverToLine(22);

  await Test.waitForFrameTimeline(target == "gecko" ? "50%" : "100%");

  await Test.checkFrames(3);

  await Test.selectFrame(1);
  await Test.waitForFrameTimeline(target == "gecko" ? "57%" : "75%");

  await Test.selectFrame(2);
  await Test.waitForFrameTimeline(target == "gecko" ? "66%" : "100%");
});
