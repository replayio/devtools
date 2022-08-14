import { test } from "@playwright/test";
import {
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

test(`Test stepping in async frames and async call stacks.`, async ({ page }) => {
  await openExample(page, "doc_async.html");
  await clickDevTools(page);

  await warpToMessage(page, "baz 2");
  await checkFrames(page, 5);
  await waitForScopeValue(page, "n", "2");

  await waitForFrameTimeline(page, "25%");

  await selectFrame(page, 1);
  await waitForScopeValue(page, "n", "3");
  await waitForFrameTimeline(page, "87%");

  await selectFrame(page, 2);
  await waitForScopeValue(page, "n", "4");
  await waitForFrameTimeline(page, "87%");

  await selectFrame(page, 3);
  await waitForFrameTimeline(page, "71%");

  await selectFrame(page, 4);
  await waitForFrameTimeline(page, "100%");

  await selectFrame(page, 0);

  await stepOverToLine(page, 20);
  await stepOverToLine(page, 21);
  await stepOverToLine(page, 22);
  await stepOverToLine(page, 24);
  await checkEvaluateInTopFrame(page, "n", 2);
  await stepOutToLine(page, 24);
  await checkEvaluateInTopFrame(page, "n", 3);
  await stepOutToLine(page, 24);
  await checkEvaluateInTopFrame(page, "n", 4);
  await stepOutToLine(page, 13);
  await reverseStepOverToLine(page, 12);
});
