import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import {
  addBreakPoint,
  addLogPoint,
  getPointPanelLocator,
  removeBreakPoint,
} from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should not erase log point content when breaking is toggled", async ({ page }) => {
  const pointPanel = getPointPanelLocator(page, 13);
  await addLogPoint(page, { sourceId, lineNumber: 13, content: '"This is custom"' });
  await takeScreenshot(page, pointPanel, "point-panel-custom-content");
  await addBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, pointPanel, "point-panel-custom-content");
  await removeBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, pointPanel, "point-panel-custom-content");
});
