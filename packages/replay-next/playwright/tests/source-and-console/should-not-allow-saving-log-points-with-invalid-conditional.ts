import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should not allow saving log points with invalid conditional", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13, condition: "'1" });
  const pointPanelLocator = getPointPanelLocator(page, 13);
  await takeScreenshot(page, pointPanelLocator, "point-panel-invalid-conditional");
});
