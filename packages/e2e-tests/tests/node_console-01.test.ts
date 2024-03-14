import { startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import { reverseStepOverToLine, waitForScopeValue } from "../helpers/pause-information-panel";
import test from "../testFixture";

test.use({ exampleKey: "node/basic.js" });

test("node_console-01: Basic node console behavior", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openConsolePanel(page);

  await warpToMessage(page, "HELLO 1");

  await executeAndVerifyTerminalExpression(page, "num", 1);
  await waitForScopeValue(page, "num", "1");
  await reverseStepOverToLine(page, 4);
});
