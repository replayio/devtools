import { openDevToolsTab, startTest, test } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  checkComputedStyle,
  selectElementsRowWithText,
} from "../helpers/elements-panel";
import { rewindToLine } from "../helpers/pause-information-panel";
import { addBreakpoint } from "../helpers/source-panel";

test("Test that styles for elements can be viewed.", async ({ screen }) => {
  await startTest(screen, "doc_inspector_styles.html");
  await openDevToolsTab(screen);
  await openConsolePanel(screen);
  await warpToMessage(screen, "ExampleFinished");
  await activateInspectorTool(screen);

  await selectElementsRowWithText(screen, "body");
  await checkComputedStyle(screen, "background-color", "rgb(0, 128, 0)");

  await selectElementsRowWithText(screen, "maindiv");
  await checkComputedStyle(screen, "background-color", "rgb(0, 0, 255)");

  await addBreakpoint(screen, { url: "doc_inspector_styles.html", lineNumber: 11 });
  await rewindToLine(screen, { lineNumber: 11 });

  await selectElementsRowWithText(screen, "maindiv");
  await checkComputedStyle(screen, "background-color", "rgb(255, 0, 0)");
});
