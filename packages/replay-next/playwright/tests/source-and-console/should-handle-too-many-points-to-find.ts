import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should handle too many points to find", async ({ page }, testInfo) => {
  await addLogPoint(page, { sourceId, lineNumber: 68, saveAfterEdit: false });

  const popup = getPointPanelLocator(page, 68);
  await takeScreenshot(page, testInfo, popup, "log-point-message-too-many-points-to-find");
});
