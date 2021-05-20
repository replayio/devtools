Test.describe(`Test stepping in async frames and async call stacks.`, async () => {
  await Test.warpToMessage("baz 2");

  await Test.checkFrames(5);

  await Test.waitForScopeValue("n", "2");
  await Test.waitForFrameTimeline("0%");

  await Test.selectFrame(1);
  await Test.waitForScopeValue("n", "3");
  await Test.waitForFrameTimeline("80%");

  await Test.selectFrame(2);
  await Test.waitForScopeValue("n", "4");
  await Test.waitForFrameTimeline("80%");

  await Test.selectFrame(3);
  await Test.waitForFrameTimeline("75%");

  await Test.selectFrame(4);
  await Test.waitForFrameTimeline("0%");

  await Test.selectFrame(0);

  await Test.stepOverToLine(20);
  await Test.stepOverToLine(21);
  await Test.stepOverToLine(22);
  await Test.stepOverToLine(24);
  await Test.checkEvaluateInTopFrame("n", 2);
  await Test.stepOutToLine(24);
  await Test.checkEvaluateInTopFrame("n", 3);
  await Test.stepOutToLine(24);
  await Test.checkEvaluateInTopFrame("n", 4);
  await Test.stepOutToLine(13);
  await Test.reverseStepOverToLine(12);
});
