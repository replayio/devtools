import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator, toggleLogPointBadge } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should allow log point badge colors to be toggled", async ({ page }, testInfo) => {
  const pointPanelLocator = getPointPanelLocator(page, 13);
  await addLogPoint(page, { sourceId, lineNumber: 13, saveAfterEdit: true });
  await takeScreenshot(page, testInfo, pointPanelLocator, "point-panel-default-badge");
  await toggleLogPointBadge(page, { sourceId, lineNumber: 13, badge: "green" });
  await takeScreenshot(page, testInfo, pointPanelLocator, "point-panel-green-badge");
  await toggleLogPointBadge(page, { sourceId, lineNumber: 13, badge: "unicorn" });
  await takeScreenshot(page, testInfo, pointPanelLocator, "point-panel-unicorn-badge");
  await toggleLogPointBadge(page, { sourceId, lineNumber: 13, badge: null });
  await takeScreenshot(page, testInfo, pointPanelLocator, "point-panel-default-badge");
});
