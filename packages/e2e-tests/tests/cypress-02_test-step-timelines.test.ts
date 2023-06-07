import test, { expect } from "@playwright/test";

import { isViewerTabActive, openDevToolsTab, openViewerTab, startTest } from "../helpers";
import {
  getErrorRows,
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRecordingBackButton,
  getTestRecordingTrees,
  getTestRowChevron,
  getTestRows,
  getTestSections,
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

test("cypress-02: Test Step timeline behavior", async ({ page }) => {
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

  const firstTest = rows.first();

  // can open tests
  await firstTest.click();
  const selectedRow = getSelectedTestCase(page);
  expect(selectedRow).toHaveCount(1);

  const steps = getTestCaseSteps(selectedRow);

  const numSteps = await steps.count();

  const hoverPercentages: number[] = [];

  // Get all the timeline values as we hover over steps
  for (let i = 0; i < numSteps; i++) {
    await steps.nth(i).hover();
    const hoverPercent = await getTimelineCurrentHoverPercent(page);
    hoverPercentages.push(hoverPercent);
  }

  // The first step is 0. All other steps should be greater than 0,
  // and greater than the step percentage before it.
  for (let i = 1; i < numSteps; i++) {
    expect(hoverPercentages[i]).toBeGreaterThan(0);
    expect(hoverPercentages[i]).toBeGreaterThan(hoverPercentages[i - 1]);
  }

  // We should be in Viewer Mode to start with
  expect(await isViewerTabActive(page)).toBe(true);

  // Clicking a step should move the timeline forward
  const clickableSteps = steps.filter({
    hasText: /get|eq|visit|type|click|find/,
  });

  const numClickableSteps = await clickableSteps.count();

  let prevPercent = 0;
  await clickableSteps.nth(0).click();

  // Do just a few of these
  for (let i = 0; i < Math.min(5, numClickableSteps); i++) {
    await clickableSteps.nth(i).click();
    prevPercent = await waitForTimelineAdvanced(page, prevPercent);
  }

  // Clicking in viewer mode shouldn't switch to DevTools mode
  expect(await isViewerTabActive(page)).toBe(true);
});
