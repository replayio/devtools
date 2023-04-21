import test from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  checkComputedStyle,
  selectElementsRowWithText,
} from "../helpers/elements-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

test("inspector-03: Test that styles for elements can be viewed", async ({ page }) => {
  await startTest(page, "doc_inspector_styles.html");
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await activateInspectorTool(page);

  await selectElementsRowWithText(page, "body");
  await checkComputedStyle(page, "background-color", "rgb(0, 128, 0)");

  await selectElementsRowWithText(page, "maindiv");
  await checkComputedStyle(page, "background-color", "rgb(0, 0, 255)");

  await addBreakpoint(page, { url: "doc_inspector_styles.html", lineNumber: 11 });
  await rewindToLine(page, 11);

  await selectElementsRowWithText(page, "maindiv");
  await checkComputedStyle(page, "background-color", "rgb(255, 0, 0)");
});
