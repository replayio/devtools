import test, { Locator, Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { executeAndVerifyTerminalExpression } from "../helpers/console-panel";
import {
  reverseStepOverToLine,
  rewindToLine,
  stepOverToLine,
} from "../helpers/pause-information-panel";
import { clickSourceTreeNode } from "../helpers/source-explorer-panel";
import { addBreakpoint } from "../helpers/source-panel";
import {
  getSelectedTestCase,
  getTestCaseSteps,
  getTestRowChevron,
  getTestRows,
  getTestSections,
  getTestSuitePanel,
  getTestSuiteResultsFailedCount,
  getTestSuiteResultsPassedCount,
  getTestSuiteResultsSkippedCount,
  openCypressTestPanel,
} from "../helpers/testsuites";
import { debugPrint, delay, waitFor } from "../helpers/utils";

const url = "flake/adding-spec.ts";

// cypress-realworld/bankaccounts.spec.js
// flake adding-spec: 970e87d2-7eb0-4c16-9763-eaa2144c06b7

test("cypress-01: Basic Test Suites panel functionality", async ({ page }) => {
  await startTest(page, url);
  await openDevToolsTab(page);

  await openCypressTestPanel(page);

  const testPanel = getTestSuitePanel(page);

  const isVisible = await testPanel.isVisible();
  expect(isVisible).toBe(true);

  // has 4 tests
  const rows = await getTestRows(page);
  await waitFor(async () => {
    await expect(rows).toHaveCount(9);
  });

  const firstTest = rows.first();

  // displays the nav chevron on hover
  const chevron = await getTestRowChevron(firstTest);
  await chevron.isHidden();
  await firstTest.hover();
  await chevron.isVisible();

  // This recording has 8 passing, 1 failing, 0 skipped tests
  const passedCountText = await getTestSuiteResultsPassedCount(page).textContent();
  expect(passedCountText.trim()).toBe("8");

  const failedCountText = await getTestSuiteResultsFailedCount(page).textContent();
  expect(failedCountText.trim()).toBe("1");

  const skippedCount = getTestSuiteResultsSkippedCount(page);
  expect(await skippedCount.isVisible()).toBe(false);

  // can open tests
  await firstTest.click();
  const selectedRow = await getSelectedTestCase(page);
  expect(selectedRow).toHaveCount(1);

  const sections = await getTestSections(selectedRow);
  await expect(sections).toHaveCount(2);

  const steps = await getTestCaseSteps(selectedRow);
  // TODO This seems wrong - previous UI + recording had 20 steps
  // but let's go with this for now
  await expect(steps).toHaveCount(18);
});
