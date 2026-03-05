import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  getElementsListRow,
  openElementsPanel,
  searchElementsPanel,
  selectNextElementsPanelSearchResult,
  verifyElementsNotAvailable,
  waitForSelectedElementsRow,
} from "../helpers/elements-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { rewindToLine } from "../helpers/source-panel";
import { seekToTimePercent } from "../helpers/timeline";
import test from "../testFixture";

test.use({ exampleKey: "doc_inspector_basic.html" });

test("inspector-elements-01: Basic DOM tree node display", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");

  await openElementsPanel(page);

  await activateInspectorTool(page);
  let node = await getElementsListRow(page, { text: 'id="maindiv"' });
  await node.waitFor();

  await openSource(page, "doc_inspector_basic.html");
  await rewindToLine(page, { lineNumber: 9 });

  node = await getElementsListRow(page, { text: 'id="maindiv"' });
  await node.waitFor();

  await searchElementsPanel(page, "STUFF");
  await selectNextElementsPanelSearchResult(page);
  await waitForSelectedElementsRow(page, 'id="div4"');

  await seekToTimePercent(page, 0);
  await verifyElementsNotAvailable(page);
});
