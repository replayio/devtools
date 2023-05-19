import { test } from "@playwright/test";

import { delay, takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should handle too many points to run analysis", async ({ page }, testInfo) => {
  await addLogPoint(page, { sourceId, lineNumber: 70, saveAfterEdit: false });

  // Give the analysis a little extra time to run.
  await delay(1000);

  const popup = getPointPanelLocator(page, 70);
  await takeScreenshot(page, testInfo, popup, "log-point-message-too-many-points-to-run-analysis");
});
