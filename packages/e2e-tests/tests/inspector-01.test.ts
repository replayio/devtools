import { openDevToolsTab, startTest, test } from "../helpers";
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

test("Test that scopes are rerendered.", async ({ screen }) => {
  await startTest(screen, "doc_inspector_basic.html");
  await openDevToolsTab(screen);
  await openConsolePanel(screen);
  await warpToMessage(screen, "ExampleFinished");
  await activateInspectorTool(screen);

  let node = getElementsRowWithText(screen, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(node);
  await getElementsRowWithText(screen, "GOODBYE").waitFor();

  await addBreakpoint(screen, { url: "doc_inspector_basic.html", lineNumber: 9 });
  await rewindToLine(screen, { lineNumber: 9 });

  node = getElementsRowWithText(screen, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(node);
  await getElementsRowWithText(screen, "HELLO").waitFor();

  await searchElementsPanel(screen, "STUFF");
  await waitForSelectedElementsRow(screen, "STUFF");

  await selectNextElementsPanelSearchResult(screen);
  await waitForSelectedElementsRow(screen, '<div id="div4" some-attribute="STUFF"');
});
