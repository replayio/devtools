import { expect } from "@playwright/test";

import {
  clickDevTools,
  inspectCanvasCoordinates,
  getElementsPanelSelection,
  openExample,
  selectInspector,
  test,
} from "../helpers";

const url = "doc_inspector_basic.html";

test(`the element picker and iframe behavior`, async ({ screen }) => {
  await openExample(screen, url);
  await clickDevTools(screen);

  await selectInspector(screen);

  // Click on the "maindiv" element in the Canvas view; this is x:5%, y:1%
  await inspectCanvasCoordinates(screen, 0.05, 0.01);
  // Verify that the currently selected element in the Elements panel is the expected one:
  await expect(await getElementsPanelSelection(screen)).toContainText("maindiv");

  // Click on the "myiframe" element in the Canvas view; this is x:5%, y:5%
  await inspectCanvasCoordinates(screen, 0.05, 0.05);
  // Verify that the currently selected element in the Elements panel is the expected one:
  await expect(await getElementsPanelSelection(screen)).toContainText("myiframe");
});
