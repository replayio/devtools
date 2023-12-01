import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  activateInspectorTool,
  getElementsListRow,
  inspectCanvasCoordinates,
  openElementsPanel,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import { delay } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_inspector_basic.html" });

test(`inspector-elements-02_node-picker: element picker and iframe behavior`, async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  // DOM/document may not be available at the end of the recording;
  // to avoid getting stuck waiting on it to load, seek to a known safe point.
  await warpToMessage(page, "ExampleFinished");

  await openElementsPanel(page);

  await waitForElementsToLoad(page);

  await activateInspectorTool(page);

  // Click on the "maindiv" element in the Canvas view; this is x:5%, y:1%
  await inspectCanvasCoordinates(page, 0.5, 0.017);

  // Verify that the currently selected element in the Elements panel is the expected one:
  let selectedRow = await getElementsListRow(page, { isSelected: true });
  await expect(selectedRow).toContainText("maindiv");

  await delay(500);

  // Click on the "myiframe" element in the Canvas view; this is x:5%, y:10%
  await inspectCanvasCoordinates(page, 0.09, 0.12);

  // Verify that the currently selected element in the Elements panel is the expected one:
  selectedRow = await getElementsListRow(page, { isSelected: true });
  await expect(selectedRow).toContainText("myiframe");
});
