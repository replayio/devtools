import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  checkComputedStyle,
  selectElementsListRow,
  toggleElementsListRow,
} from "../helpers/elements-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { rewindToLine } from "../helpers/source-panel";
import test from "../testFixture";

test.use({ exampleKey: "doc_inspector_styles.html" });

test("inspector-computed-01: Basic computed styles can be viewed", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);
  await openConsolePanel(page);
  await warpToMessage(page, "ExampleFinished");
  await activateInspectorTool(page);

  const row = await selectElementsListRow(page, { text: "<body" });
  await checkComputedStyle(page, "background-color", "rgb(0, 128, 0)");

  await toggleElementsListRow(page, row, true);
  await selectElementsListRow(page, { text: 'div id="maindiv"', type: "opening" });
  await checkComputedStyle(page, "background-color", "rgb(0, 0, 255)");

  await openSource(page, "doc_inspector_styles.html");
  await rewindToLine(page, { lineNumber: 11 });

  await selectElementsListRow(page, { text: 'div id="maindiv"', type: "opening" });
  await checkComputedStyle(page, "background-color", "rgb(255, 0, 0)");
});
