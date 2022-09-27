import {
  test,
  openExample,
  clickDevTools,
  rewindToLine,
  stepOverToLine,
  stepOutToLine,
  stepInToLine,
  addEventListenerLogpoints,
  addBreakpoint,
  resumeToLine,
  selectConsole,
  selectFrame,
  checkFrames,
  waitForFrameTimeline,
  warpToMessage,
  waitForScopeValue,
  checkEvaluateInTopFrame,
  reverseStepOverToLine,
} from "../helpers";

test(`Test stepping in async frames and async call stacks.`, async ({ screen }) => {
  await openExample(screen, "doc_async.html");
  await clickDevTools(screen);

  await warpToMessage(screen, "baz 2");
  await checkFrames(screen, 5);
  await waitForScopeValue(screen, "n", "2");

  await waitForFrameTimeline(screen, "25%");

  await selectFrame(screen, 1);
  await waitForScopeValue(screen, "n", "3");
  await waitForFrameTimeline(screen, "87%");

  await selectFrame(screen, 2);
  await waitForScopeValue(screen, "n", "4");
  await waitForFrameTimeline(screen, "87%");

  await selectFrame(screen, 3);
  await waitForFrameTimeline(screen, "71%");

  await selectFrame(screen, 4);
  await waitForFrameTimeline(screen, "100%");

  await selectFrame(screen, 0);

  await stepOverToLine(screen, 20);
  await stepOverToLine(screen, 21);
  await stepOverToLine(screen, 22);
  await stepOverToLine(screen, 24);
  await checkEvaluateInTopFrame(screen, "n", 2);
  await stepOutToLine(screen, 24);
  await checkEvaluateInTopFrame(screen, "n", 3);
  await stepOutToLine(screen, 24);
  await checkEvaluateInTopFrame(screen, "n", 4);
  await stepOutToLine(screen, 13);
  await reverseStepOverToLine(screen, 12);
});
