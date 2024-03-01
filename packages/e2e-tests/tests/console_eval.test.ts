import { openDevToolsTab, startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_basic.html" });

test("console_eval: support console evaluations", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);
  await openConsolePanel(page);

  await warpToMessage(page, "ExampleFinished", 7);
  await executeAndVerifyTerminalExpression(page, "333", 333);
  await executeAndVerifyTerminalExpression(page, "number", 10);
  await executeAndVerifyTerminalExpression(page, "window.updateNumber", "ƒupdateNumber()");
});
