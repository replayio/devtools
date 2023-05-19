import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { addLogPoint, getPointPanelLocator, toggleShouldLog } from "../utils/source";
import { beforeEach } from "./beforeEach";
import { sourceId } from "./shared";

beforeEach();

test("should show different background color and edit icon when log point disabled", async ({
  page,
}, testInfo) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });
  const logPointPanel = getPointPanelLocator(page, 13);
  await takeScreenshot(page, testInfo, logPointPanel, "log-point-panel-enabled");
  await toggleShouldLog(page, { sourceId, lineNumber: 13, state: false });
  await takeScreenshot(page, testInfo, logPointPanel, "log-point-panel-disabled");
  await toggleShouldLog(page, { sourceId, lineNumber: 13, state: true });
  await takeScreenshot(page, testInfo, logPointPanel, "log-point-panel-enabled");
});
