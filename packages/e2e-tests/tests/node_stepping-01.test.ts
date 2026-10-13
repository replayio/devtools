import { startTest } from "../helpers";
import { executeAndVerifyTerminalExpression, warpToMessage } from "../helpers/console-panel";
import {
  openPauseInformationPanel,
  reverseStepOverToLine,
  selectFrame,
  stepOutToLine,
  stepOverToLine,
  verifyFramesCount,
  waitForFrameTimeline,
  waitForScopeValue,
} from "../helpers/pause-information-panel";
import test, { Page, expect } from "../testFixture";

test.use({ exampleKey: "node/async.js" });

test("node_stepping-01: Test stepping in async frames and async call stacks", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);

  await openPauseInformationPanel(page);

  await warpToMessage(page, "baz 2");
  await verifyFramesCount(page, 5);

  await waitForScopeValue(page, "n", "2");
  // Two of this frame's seven steps have run.
  await waitForFrameTimeline(page, "28%");

  await selectFrame(page, 1);
  await waitForScopeValue(page, "n", "3");
  await waitForFrameTimeline(page, "85%");

  await selectFrame(page, 2);
  await waitForScopeValue(page, "n", "4");
  await waitForFrameTimeline(page, "85%");

  await selectFrame(page, 3);
  await waitForFrameTimeline(page, "71%");

  await selectFrame(page, 4);
  // The outermost frame has a single step, so it reads as complete.
  await waitForFrameTimeline(page, "100%");

  await selectFrame(page, 0);

  await stepOverToLine(page, 20);
  await stepOverToLine(page, 21);
  // Line 22 steps twice: the await, then the baz call it awaits.
  await stepOverToLine(page, 22);
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
