import { startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { reverseStepOverToLine, waitForPaused } from "../helpers/pause-information-panel";
import test from "../testFixture";

test.use({ exampleKey: "node/error.js" });

test("node_console-02: uncaught exceptions should show up", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openConsolePanel(page);

  await warpToMessage(page, "ReferenceError: b is not defined");

  await waitForPaused(page, 2);
  await reverseStepOverToLine(page, 4);
});
