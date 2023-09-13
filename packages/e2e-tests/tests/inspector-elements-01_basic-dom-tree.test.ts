import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  getElementsRowWithText,
  searchElementsPanel,
  selectNextElementsPanelSearchResult,
  toggleMarkupNode,
  waitForSelectedElementsRow,
} from "../helpers/elements-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_inspector_basic.html" });

test("inspector-elements-01: Basic DOM tree node display", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");

  await activateInspectorTool(page);
  let node = await getElementsRowWithText(page, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(page, node, true);

  node = await getElementsRowWithText(page, "GOODBYE");
  await node.waitFor();

  await addBreakpoint(page, { url: "doc_inspector_basic.html", lineNumber: 9 });
  await rewindToLine(page, 9);

  node = await getElementsRowWithText(page, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(page, node, true);

  node = await getElementsRowWithText(page, "HELLO");
  await node.waitFor();

  await searchElementsPanel(page, "STUFF");
  await waitForSelectedElementsRow(page, "STUFF");

  await selectNextElementsPanelSearchResult(page);
  await waitForSelectedElementsRow(page, '<div id="div4" some-attribute="STUFF"');
});
