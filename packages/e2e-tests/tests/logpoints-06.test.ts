import test, { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { verifyConsoleMessage } from "../helpers/console-panel";
import {
  findPoints,
  openPauseInformationPanel,
  openPrintStatementsAccordionPane,
  togglePoint,
} from "../helpers/pause-information-panel";
import { addLogpoint, removeLogPoint } from "../helpers/source-panel";

const url = "log_points_and_block_scope.html";

const MESSAGE = "Test log point";

test(`logpoints-06: should be temporarily disabled`, async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  // Add log point and verify text in console
  await addLogpoint(page, { content: `"${MESSAGE}"`, lineNumber: 5, url });
  await verifyConsoleMessage(page, MESSAGE, "log-point", 1);

  // Find the newly added point in the side panel
  await openPauseInformationPanel(page);
  await openPrintStatementsAccordionPane(page);
  const logpoints = findPoints(page, "logpoint", { lineNumber: 5 });
  await expect(await logpoints.count()).toBe(1);
  const logpoint = logpoints.first();

  // Temporarily disable and verify log point text not in console
  // but that it's still present in the side panel
  await togglePoint(page, logpoint, false);
  await verifyConsoleMessage(page, MESSAGE, "log-point", 0);
  await expect(await logpoints.count()).toBe(1);

  // Temporarily enable and verify log point text in console
  await togglePoint(page, logpoint, true);
  await verifyConsoleMessage(page, MESSAGE, "log-point", 1);

  // Delete the logpoint and verify that it's no longer in the side panel
  await removeLogPoint(page, { lineNumber: 5, url });
  await expect(await logpoints.count()).toBe(0);
});
