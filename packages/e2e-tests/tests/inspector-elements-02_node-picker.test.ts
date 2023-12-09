import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  getElementsListRow,
  inspectCanvasCoordinates,
  openElementsPanel,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import { delay } from "../helpers/utils";
import test, { expect } from "../testFixtureCloneRecording";

test.use({ exampleKey: "node_picker.html" });

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

  // Click on the "main-div" element
  await inspectCanvasCoordinates(page, 0.5, 0.25);

  // Verify that the currently selected element in the Elements panel is the expected one:
  let selectedRow = await getElementsListRow(page, { isSelected: true });
  await expect(selectedRow).toContainText('class="main-div"');

  await delay(500);

  // Click on the "iframe" element
  await inspectCanvasCoordinates(page, 0.5, 0.75);

  // Verify that the currently selected element in the Elements panel is the expected one:
  selectedRow = await getElementsListRow(page, { isSelected: true });
  await expect(selectedRow).toContainText('class="inner-div"');
});
