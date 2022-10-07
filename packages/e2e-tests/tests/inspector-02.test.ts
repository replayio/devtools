import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import {
  activateInspectorTool,
  getElementsPanelSelection,
  inspectCanvasCoordinates,
  openElementsPanel,
  waitForElementsToLoad,
} from "../helpers/elements-panel";

const url = "doc_inspector_basic.html";

test(`inspector-02: element picker and iframe behavior`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);
  await openElementsPanel(page);
  await waitForElementsToLoad(page);

  await activateInspectorTool(page);

  // Click on the "maindiv" element in the Canvas view; this is x:5%, y:1%
  await inspectCanvasCoordinates(page, 0.05, 0.01);

  // Verify that the currently selected element in the Elements panel is the expected one:
  let selectedRow = await getElementsPanelSelection(page);
  await expect(selectedRow).toContainText("maindiv");

  // Click on the "myiframe" element in the Canvas view; this is x:5%, y:5%
  await inspectCanvasCoordinates(page, 0.05, 0.05);

  // Verify that the currently selected element in the Elements panel is the expected one:
  selectedRow = await getElementsPanelSelection(page);
  await expect(selectedRow).toContainText("myiframe");
});
