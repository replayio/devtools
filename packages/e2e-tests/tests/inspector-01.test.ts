import test from "@playwright/test";

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

test("Test that scopes are rerendered.", async ({ page }) => {
  await startTest(page, "doc_inspector_basic.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await activateInspectorTool(page);

  let node = getElementsRowWithText(page, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(node, true);
  await getElementsRowWithText(page, "GOODBYE").waitFor();

  await addBreakpoint(page, { url: "doc_inspector_basic.html", lineNumber: 9 });
  await rewindToLine(page, { lineNumber: 9 });

  node = getElementsRowWithText(page, '<div id="maindiv" style="color: red"');
  await node.waitFor();
  await toggleMarkupNode(node, true);
  await getElementsRowWithText(page, "HELLO").waitFor();

  await searchElementsPanel(page, "STUFF");
  await waitForSelectedElementsRow(page, "STUFF");

  await selectNextElementsPanelSearchResult(page);
  await waitForSelectedElementsRow(page, '<div id="div4" some-attribute="STUFF"');
});
