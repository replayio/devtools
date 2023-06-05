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
  getTestCaseSections,
  getTestCaseSteps,
  getTestRowChevron,
  getTestRows,
  getTestSuitePanel,
  openCypressTestPanel,
} from "../helpers/testsuites";
import { delay, waitFor } from "../helpers/utils";

const url = "cypress-realworld/bankaccounts.spec.js";

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
    await expect(rows).toHaveCount(4);
  });

  const firstTest = rows.first();

  // displays the nav chevron on hover
  const chevron = await getTestRowChevron(firstTest);
  await chevron.isHidden();
  await firstTest.hover();
  await chevron.isVisible();

  // can open tests
  await firstTest.click();
  const selectedRow = await getSelectedTestCase(page);
  expect(selectedRow).toHaveCount(1);
  const sections = await getTestCaseSections(selectedRow);
  await expect(sections).toHaveCount(2);
  const steps = await getTestCaseSteps(selectedRow);
  await expect(steps).toHaveCount(61);
});
