import { Locator } from "@playwright/test";

import { isViewerTabActive, openViewerTab, startTest } from "../helpers";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRows,
  getTestStepBeforeAfterButtons,
  getTestSuitePanel,
  getUserActionEventDetails,
  openPlaywrightTestPanel,
} from "../helpers/testsuites";
import { waitForTimelineAdvanced } from "../helpers/timeline";
import { getByTestName, waitFor } from "../helpers/utils";
import test, { expect } from "../testFixture";

test.use({ exampleKey: "playwright/breakpoints-05" });

test("playwright-03: Test Step interactions", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openViewerTab(page);

  await openPlaywrightTestPanel(page);

  // has 1 test
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(1);
  });

  const breakpointsTest = rows
    .filter({ hasText: "breakpoints-05: Test interaction of breakpoints with debugger statements" })
    .first();

  // can open tests
  await breakpointsTest.click();
  const selectedRow = getSelectedTestCase(page);
  await waitFor(async () => {
    expect(await selectedRow.isVisible()).toBe(true);
    expect(selectedRow).toHaveCount(1);
  });

  const steps = getTestCaseSteps(selectedRow);
  const numSteps = await steps.count();
  await expect(numSteps).toBeGreaterThan(200);

  // We should be in Viewer Mode to start with
  expect(await isViewerTabActive(page)).toBe(true);

  const clickableSteps = steps.filter({
    hasText: /click|press|type|count/,
  });

  let prevPercent = 0;
  await clickableSteps.nth(0).click();

  // Clicking in viewer mode shouldn't switch to DevTools mode
  expect(await isViewerTabActive(page)).toBe(true);

  const firstClick = clickableSteps.filter({ hasText: /click/ }).first();

  // Jump to the first `click` step
  await firstClick.click();
  prevPercent = await waitForTimelineAdvanced(page, prevPercent);

  // Should show the "Before/After" buttons
  const beforeAfterButtons = getTestStepBeforeAfterButtons(page);
  await beforeAfterButtons.waitFor({ state: "visible" });

  const afterButton = beforeAfterButtons.locator("button", { hasText: "After" }).first();

  // Clicking "After" changes the current time
  await afterButton.click();
  prevPercent = await waitForTimelineAdvanced(page, prevPercent);

  const SPEC_FILE = /breakpoints-05/;

  // Clicking each step should change the details pane
  await waitFor(async () => {
    const detailsPane = getUserActionEventDetails(page);
    await expect(detailsPane).toBeAttached();

    const lastLocation = getByTestName(detailsPane, "TestEventDetailsCallStackFile").last();
    await expect(lastLocation).toHaveText(SPEC_FILE);
  });
});
