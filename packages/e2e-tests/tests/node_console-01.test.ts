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
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openConsolePanel(page);

  await warpToMessage(page, "HELLO 1");

  await executeAndVerifyTerminalExpression(page, "num", 1);
  await waitForScopeValue(page, "num", "1");
  // The message is logged by the console.log call itself, partway through its
  // statement, so stepping back reaches the start of the statement before the
  // caller.
  await reverseStepOverToLine(page, 9);
  await reverseStepOverToLine(page, 4);
});
