import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator, waitForLogpointResults } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should handle too many points to run analysis", async ({ page }, testInfo) => {
  const lineNumber = 70;
  await addLogPoint(page, { sourceId, lineNumber, saveAfterEdit: false });

  await waitForLogpointResults(page, sourceId, lineNumber);

  const popup = getPointPanelLocator(page, lineNumber);
  await takeScreenshot(page, testInfo, popup, "log-point-message-too-many-points-to-run-analysis");
});
