import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  findElementCoordinates,
  getElementsListRow,
  inspectCanvasCoordinates,
  openElementsPanel,
  selectElementsListRow,
  waitForElementsToLoad,
} from "../helpers/elements-panel";
import test, { expect } from "../testFixture";

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

  // Click on a DIV element and verify the selection
  {
    const { x, y } = await findElementCoordinates(page, 'id="maindiv"');
    // findElementCoordinates() will select the element, so we need to select
    // a different one first to test if selecting the element using the picker works
    await selectElementsListRow(page, { text: "<body>" });
    await inspectCanvasCoordinates(page, x, y);

    const selectedRow = await getElementsListRow(page, { isSelected: true });
    await expect(selectedRow).toContainText('id="maindiv"');
  }

  // Click on the content inside of an iframe and verify the selection
  {
    const { x, y } = await findElementCoordinates(page, 'data-test-id="inner-body"');
    // findElementCoordinates() will select the element, so we need to select
    // a different one first to test if selecting the element using the picker works
    await selectElementsListRow(page, { text: "<body>" });
    await inspectCanvasCoordinates(page, x, y);

    const selectedRow = await getElementsListRow(page, { isSelected: true });
    await expect(selectedRow).toContainText('data-test-id="inner-body"');
  }
});
