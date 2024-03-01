import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import { selectFrame, stepOutToLine, stepOverToLine } from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addLogpoint } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_rr_basic.html" });

test("stepping-04: Test stepping in a frame other than the top frame", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // Open doc_rr_basic.html
  await clickSourceTreeNode(page, "test");
  await clickSourceTreeNode(page, "examples");
  await clickSourceTreeNode(page, exampleKey);

  await addLogpoint(page, { lineNumber: 24, url: exampleKey, content: "'logpoint', number" });

  await warpToMessage(page, "logpoint 5");
  await selectFrame(page, 1);
  await stepOverToLine(page, 21);

  await warpToMessage(page, "logpoint 5");
  await selectFrame(page, 1);
  await stepOutToLine(page, 12);
});
