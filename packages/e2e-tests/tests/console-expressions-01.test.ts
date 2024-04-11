import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  executeTerminalExpression,
  openConsolePanel,
  submitCurrentText,
  verifyConsoleMessage,
  verifyEagerEvaluationResult,
  verifyEvaluationResult,
  warpToMessage,
} from "../helpers/console-panel";
import { selectFrame, verifyFramesCount } from "../helpers/pause-information-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_async.html" });

test("console-expressions-01: should cache input eager eval and terminal expressions per instance", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "baz 2", 19);
  await verifyFramesCount(page, 5); // 2 sync + 3 async

  await executeTerminalExpression(page, "`n: ${n}`", false);
  await verifyEagerEvaluationResult(page, "n: 2");
  await submitCurrentText(page);
  await verifyEvaluationResult(page, "n: 2");

  await executeAndVerifyTerminalExpression(page, "n = 10", "10");

  await executeTerminalExpression(page, "`n: ${n}`", false);
  await verifyEagerEvaluationResult(page, "n: 10");
  await submitCurrentText(page);
  await verifyEvaluationResult(page, "n: 10");
});
