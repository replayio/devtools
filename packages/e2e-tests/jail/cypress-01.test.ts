import test, { expect } from "@playwright/test";

import { startTest } from "../helpers";
import {
  getCypressLogo,
  getTestCaseSections,
  getTestCaseSteps,
  getTestRowChevron,
  getTestRowError,
  getTestRows,
} from "../helpers/testsuites";

const url = "cypress/doc_inspector_styles";

test(`cypress-01: Test basic cypress reporter functionality`, async ({ page }) => {
  await startTest(page, url);

  // shows the cypress logo
  const logo = await getCypressLogo(page);
  await logo.waitFor({ state: "attached" });

  // has 9 tests
  const rows = await getTestRows(page);
  await expect(rows).toHaveCount(4, { timeout: 60_000 });

  const firstTest = rows.first();

  // displays the nav chevron on hover
  const chevron = await getTestRowChevron(firstTest);
  await chevron.isHidden();
  await firstTest.hover();
  await chevron.isVisible();

  // shows the error icon and message
  const failedRow = rows.nth(3);
  await failedRow.locator(".testsuites-fail").isVisible();
  const failedRowError = await getTestRowError(failedRow);
  await expect(failedRowError).toContainText("Error");

  // can open tests
  await failedRow.click();
  const selectedRow = await getTestRows(page);
  expect(selectedRow).toHaveCount(1);
  const sections = await getTestCaseSections(selectedRow);
  await expect(sections).toHaveCount(2);
  const steps = await getTestCaseSteps(selectedRow);
  await expect(steps).toHaveCount(3);

  // failed test should be visible
  await steps.nth(2).isVisible();
});
