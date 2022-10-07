import test from "@playwright/test";

import { getRecordingTarget, openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression, warpToMessage } from "../helpers/console-panel";
import {
  reverseStepOverToLine,
  selectFrame,
  stepOutToLine,
  stepOverToLine,
  verifyFramesCount,
  waitForFrameTimeline,
  waitForScopeValue,
} from "../helpers/pause-information-panel";

const url = "doc_async.html";

// Because stepping works differently between gecko and chromium,
// frame timeline percentages are different in this test.
test(`stepping-06: Test stepping in async frames and async call stacks`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  const target = await getRecordingTarget(page);

  await warpToMessage(page, "baz 2");
  await verifyFramesCount(page, 5);
  await waitForScopeValue(page, "n", "2");
  await waitForFrameTimeline(page, target == "gecko" ? "25%" : "0%");
  await selectFrame(page, 1);
  await waitForScopeValue(page, "n", "3");
  await waitForFrameTimeline(page, target == "gecko" ? "87%" : "80%");
  await selectFrame(page, 2);
  await waitForScopeValue(page, "n", "4");
  await waitForFrameTimeline(page, target == "gecko" ? "87%" : "80%");
  await selectFrame(page, 3);
  await waitForFrameTimeline(page, target == "gecko" ? "71%" : "75%");
  await selectFrame(page, 4);
  await waitForFrameTimeline(page, target == "gecko" ? "100%" : "0%");
  await selectFrame(page, 0);
  await stepOverToLine(page, 20);
  await stepOverToLine(page, 21);
  await stepOverToLine(page, 22);
  await stepOverToLine(page, 24);
  await executeAndVerifyTerminalExpression(page, "n", 2);
  await stepOutToLine(page, 24);
  await executeAndVerifyTerminalExpression(page, "n", 3);
  await stepOutToLine(page, 24);
  await executeAndVerifyTerminalExpression(page, "n", 4);
  await stepOutToLine(page, 13);
  await reverseStepOverToLine(page, 12);
});
