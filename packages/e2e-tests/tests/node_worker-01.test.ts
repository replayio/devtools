import { startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { stepOverToLine } from "../helpers/pause-information-panel";
import { addBreakpoint, rewindToLine } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "node/run_worker.js" });

test("node_worker-01: make sure node workers don't cause crashes", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);

  await openConsolePanel(page);

  await warpToMessage(page, "GotWorkerMessage pong");
  await stepOverToLine(page, 18);

  await addBreakpoint(page, { url: "run_worker.js", lineNumber: 13 });
  await rewindToLine(page, { lineNumber: 13 });

  await addBreakpoint(page, { url: "run_worker.js", lineNumber: 6 });
  await rewindToLine(page, { lineNumber: 6 });
});
