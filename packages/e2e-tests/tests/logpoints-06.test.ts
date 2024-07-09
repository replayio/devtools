import { openDevToolsTab, startTest } from "../helpers";
import { verifyConsoleMessage } from "../helpers/console-panel";
import {
  findPoints,
  openPauseInformationPanel,
  openPrintStatementsAccordionPane,
  togglePoint,
} from "../helpers/pause-information-panel";
import {
  addLogpoint,
  editLogPoint,
  removeLogPoint,
  toggleShouldLog,
} from "../helpers/source-panel";
import test, { expect } from "../testFixture";

const lineNumber = 5;
test.use({ exampleKey: "log_points_and_block_scope.html" });

test(`logpoints-06: should be temporarily disabled`, async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  let MESSAGE = "Test log point";

  // Add log point and verify text in console
  await addLogpoint(page, { content: `"${MESSAGE}"`, lineNumber, url: exampleKey });
  await verifyConsoleMessage(page, MESSAGE, "log-point", 1);

  // Find the newly added point in the side panel
  await openPauseInformationPanel(page);
  await openPrintStatementsAccordionPane(page);
  const logpoints = findPoints(page, { lineNumber });
  await expect(await logpoints.count()).toBe(1);
  const logpoint = logpoints.first();

  // Temporarily disable and verify log point text not in console
  // but that it's still present in the side panel
  await togglePoint(page, logpoint, false);
  await verifyConsoleMessage(page, MESSAGE, "log-point", 0);
  await expect(await logpoints.count()).toBe(1);

  MESSAGE = "Test log point: edit";

  // Editing and cancelling should not re-enable the log point
  await editLogPoint(page, {
    content: `"${MESSAGE}"`,
    lineNumber,
    saveAfterEdit: false,
    url: exampleKey,
  });
  await verifyConsoleMessage(page, MESSAGE, "log-point", 0);

  // Editing and saving should re-enable the log point
  await editLogPoint(page, {
    content: `"${MESSAGE}"`,
    lineNumber,
    url: exampleKey,
    saveAfterEdit: true,
  });
  await verifyConsoleMessage(page, MESSAGE, "log-point", 1);

  // Now disable and re-enable the log point using the context menu
  await toggleShouldLog(page, { lineNumber, state: false });
  await verifyConsoleMessage(page, MESSAGE, "log-point", 0);
  await toggleShouldLog(page, { lineNumber, state: true });
  await verifyConsoleMessage(page, MESSAGE, "log-point", 1);

  // Delete the logpoint and verify that it's no longer in the side panel
  await removeLogPoint(page, { lineNumber, url: exampleKey });
  await expect(await logpoints.count()).toBe(0);
});
