import { expect } from "@playwright/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import {
  activateInspectorTool,
  getElementsPanelSelection,
  inspectCanvasCoordinates,
} from "../helpers/elements-panel";

const url = "doc_inspector_basic.html";

test(`the element picker and iframe behavior`, async ({ screen }) => {
  await startTest(screen, url);
  await openDevToolsTab(screen);

  await activateInspectorTool(screen);

  // Click on the "maindiv" element in the Canvas view; this is x:5%, y:1%
  await inspectCanvasCoordinates(screen, 0.05, 0.01);
  // Verify that the currently selected element in the Elements panel is the expected one:
  await expect(await getElementsPanelSelection(screen)).toContainText("maindiv");

  // Click on the "myiframe" element in the Canvas view; this is x:5%, y:5%
  await inspectCanvasCoordinates(screen, 0.05, 0.05);
  // Verify that the currently selected element in the Elements panel is the expected one:
  await expect(await getElementsPanelSelection(screen)).toContainText("myiframe");
});
