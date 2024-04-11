import { startTest } from "../helpers";
import {
  executeAndVerifyTerminalExpression,
  openConsolePanel,
  warpToMessage,
} from "../helpers/console-panel";
import { reverseStepOverToLine } from "../helpers/pause-information-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { addLogpoint } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "node/basic.js" });

test("node_logpoint-01: Basic node logpoints", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);

  await openConsolePanel(page);

  await openSource(page, "basic.js");

  await addLogpoint(page, { url: "basic.js", lineNumber: 4, content: `"CALL", i` });

  await warpToMessage(page, "CALL 2");

  // TODO [FE-626] Autocompletion behavior is breaking terminal expressions right now
  await executeAndVerifyTerminalExpression(page, "i", 2);

  await reverseStepOverToLine(page, 3);
});
