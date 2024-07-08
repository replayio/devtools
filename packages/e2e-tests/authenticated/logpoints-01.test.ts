import { openDevToolsTab, startTest } from "../helpers";
import { E2E_USER_1, E2E_USER_2 } from "../helpers/authentication";
import { disableAllConsoleMessageTypes, verifyConsoleMessage } from "../helpers/console-panel";
import {
  findPoints,
  isPointEditable,
  openPauseInformationPanel,
  togglePoint,
} from "../helpers/pause-information-panel";
import { openSource } from "../helpers/source-explorer-panel";
import { addLogpoint, editLogPoint, removeAllLogpoints } from "../helpers/source-panel";
import { waitForRecordingToFinishIndexing } from "../helpers/utils";
import test, { Page, expect } from "../testFixture";

const url = "authenticated_logpoints.html";
const lineNumber = 14;

async function load(page: Page, recordingId: string, apiKey: string, testScope: string) {
  await startTest(page, recordingId, testScope, apiKey);
  await page.coverage.startJSCoverage();

  await openDevToolsTab(page);
  await openSource(page, url);
  await openPauseInformationPanel(page);

  await disableAllConsoleMessageTypes(page);
}

test.use({ exampleKey: url, testUsers: [E2E_USER_1, E2E_USER_2] });

test(`authenticated/logpoints-01: Shared logpoints functionality`, async ({
  browser,
  pageWithMeta: { recordingId, testScope },
  testUsers,
}) => {
  let pageOne: Page;
  let pageTwo: Page;

  {
    console.log("User 1: Add logpoint");

    // User 1
    const context = await browser.newContext();
    const page = await context.newPage();
    await load(page, recordingId, testUsers![0].apiKey, testScope);

    // Add log point (will be shared, since we're authenticated)
    await addLogpoint(page, {
      lineNumber,
      content: '"initial:", iteration',
      url,
      saveAfterEdit: true,
    });
    await verifyConsoleMessage(page, "initial:", "log-point", 10);

    pageOne = page;
  }

  {
    console.log("User 2: View shared logpoint");

    // User 2
    const context = await browser.newContext();
    const page = await context.newPage();
    await load(page, recordingId, testUsers![1].apiKey, testScope);

    const locator = await findPoints(page, { lineNumber });

    // Verify point is not editable
    await expect(await isPointEditable(locator)).toBe(false);

    // Verify shared log point is present and can be enabled/disabled
    await verifyConsoleMessage(page, "initial:", "log-point", 0);
    await togglePoint(page, locator, true);
    await verifyConsoleMessage(page, "initial:", "log-point", 10);

    pageTwo = page;
  }

  {
    console.log("User 1: Edit shared logpoint");

    // User 1
    const page = pageOne;
    await page.reload();

    await waitForRecordingToFinishIndexing(page);

    // Verify log point is still present and not affected by user 2
    await verifyConsoleMessage(page, "initial:", "log-point", 10);

    await editLogPoint(page, {
      content: "'updated:', iteration",
      lineNumber,
      saveAfterEdit: true,
      url,
    });
    await verifyConsoleMessage(page, "updated:", "log-point", 10);
  }

  {
    console.log("User 2: View updated logpoint");

    // User 2
    const page = pageTwo;
    await page.reload();

    await waitForRecordingToFinishIndexing(page);

    // Point should show updated content
    await verifyConsoleMessage(page, "updated:", "log-point", 10);
  }

  {
    console.log("User 1: Delete logpoint");

    // User 1
    const page = pageOne;

    // Cleanup
    await removeAllLogpoints(page);
  }

  {
    await pageOne.close();
    await pageTwo.close();
  }
});
