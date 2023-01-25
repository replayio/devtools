import test, { expect } from "@playwright/test";

import { startTest } from "../helpers";
import { getLineNumberHitCount } from "../helpers/source-panel";
import { getCypressLogo, getTestCaseSteps, getTestRows } from "../helpers/testsuites";

const url = "cypress/basic";

// maps test index to line number in spec file that should have 1 hit
const specLines = [30, 38, 44, 56, 66, 84, 93, 99, 105];

test(`cypress-01: Test cypress reporter focus and timeline behavior`, async ({ page }) => {
  await startTest(page, url);

  // shows the cypress logo
  const logo = await getCypressLogo(page);
  await logo.waitFor({ state: "attached" });

  // has 9 tests
  const rows = await getTestRows(page);
  await expect(rows).toHaveCount(9);
  await page.waitForTimeout(1000);

  for await (let [testIndex, lineNumber] of specLines.entries()) {
    const testRow = rows.nth(testIndex);

    // open the test
    await testRow.locator("button").click();
    const selectedRow = await getTestRows(page);
    expect(selectedRow).toHaveCount(1);
    const steps = await getTestCaseSteps(selectedRow);
    const firstStep = steps.first();

    // navigate to the source via the context menu
    await firstStep.click();
    await page.waitForTimeout(5000);
    await firstStep.locator("[data-test-id='TestSuites-TestCase-TestStepRow-Actions']").click();
    await page
      .locator('[data-test-id="TestSuites-TestCase-TestStepRow-ContextMenu"]')
      .locator("text=Jump to source")
      .click();

    await page.waitForTimeout(5000);

    // verify hit counts
    await page.locator(".source-tab").first().waitFor({ state: "attached" });
    await page.locator("[data-test-id^=SourceLine]").first().waitFor({ state: "attached" });
    const hitCount = getLineNumberHitCount(lineNumber, page);
    expect(hitCount, `Failed to find hits for test ${testIndex}`).toHaveText("1", {
      timeout: 10000,
    });

    // back to list
    const isHeaderVisible = await page
      .locator('[data-test-id="TestSuite-TestCaseHeader"]')
      .isVisible();
    if (!isHeaderVisible) {
      const logo = await getCypressLogo(page);
      await logo.click();
    }

    await page.locator('[data-test-id="TestSuite-TestCaseHeader"]').click();
    await page.waitForTimeout(1000);
  }
});
