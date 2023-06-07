import test, { expect } from "@playwright/test";

import { isViewerTabActive, openDevToolsTab, openViewerTab, startTest } from "../helpers";
import { closeSource, getSelectedLineNumber, waitForSelectedSource } from "../helpers/source-panel";
import {
  getErrorRows,
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRecordingBackButton,
  getTestRecordingTrees,
  getTestRowChevron,
  getTestRows,
  getTestSections,
  getTestStepBeforeAfterButtons,
  getTestSuiteBranch,
  getTestSuiteDate,
  getTestSuiteDuration,
  getTestSuitePanel,
  getTestSuiteResultsFailedCount,
  getTestSuiteResultsPassedCount,
  getTestSuiteResultsSkippedCount,
  getTestSuiteUser,
  openCypressTestPanel,
} from "../helpers/testsuites";
import {
  getTimelineCurrentHoverPercent,
  getTimelineCurrentPercent,
  waitForTimelineAdvanced,
} from "../helpers/timeline";
import { debugPrint, delay, waitFor } from "../helpers/utils";

const url = "flake/adding-spec.ts";

test("cypress-03: Test Step interactions", async ({ page }) => {
  await startTest(page, url);
  await openViewerTab(page);

  await openCypressTestPanel(page);

  const testPanel = getTestSuitePanel(page);

  const isVisible = await testPanel.isVisible();
  expect(isVisible).toBe(true);

  // has 9 tests
  const rows = getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(9);
  });

  const trimTest = rows.filter({ hasText: /trim/ }).first();

  // can open tests
  await trimTest.click();
  const selectedRow = getSelectedTestCase(page);
  expect(selectedRow).toHaveCount(1);

  const steps = getTestCaseSteps(selectedRow);

  const numSteps = await steps.count();

  // We should be in Viewer Mode to start with
  expect(await isViewerTabActive(page)).toBe(true);

  const clickableSteps = steps.filter({
    hasText: /get|eq|visit|type|click|find/,
  });

  const numClickableSteps = await clickableSteps.count();

  let prevPercent = 0;
  await clickableSteps.nth(0).click();

  // Clicking in viewer mode shouldn't switch to DevTools mode
  expect(await isViewerTabActive(page)).toBe(true);

  const firstGet = clickableSteps.filter({ hasText: /get/ }).first();

  // Jump to the first `get` step
  await firstGet.click();
  prevPercent = await waitForTimelineAdvanced(page, prevPercent);

  // Should show the "Before/After" buttons
  const beforeAfterButtons = getTestStepBeforeAfterButtons(page);
  expect(await beforeAfterButtons.isVisible()).toBe(true);

  const afterButton = beforeAfterButtons.locator("button", { hasText: "After" }).first();

  await afterButton.click();
  prevPercent = await waitForTimelineAdvanced(page, prevPercent);

  const networkStep = steps.filter({ hasText: /localhost/ }).first();
  await networkStep.click();
  await waitFor(async () => {
    expect(await beforeAfterButtons.isVisible()).toBe(false);
  });

  const SPEC_FILE_NAME = "adding-spec.ts";

  await openDevToolsTab(page);

  // Clicking a test step in DevTools mode should open the source
  // and select the line
  await closeSource(page, SPEC_FILE_NAME);

  await firstGet.click();

  await waitForSelectedSource(page, SPEC_FILE_NAME);

  // Should highlight the line with this step
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(84);
  });

  const firstEq = clickableSteps.filter({ hasText: /eq/ }).first();

  await firstEq.click();

  await waitForSelectedSource(page, SPEC_FILE_NAME);

  // Should highlight the new step's line
  await waitFor(async () => {
    const lineNumber = await getSelectedLineNumber(page, false);
    expect(lineNumber).toBe(89);
  });
});
