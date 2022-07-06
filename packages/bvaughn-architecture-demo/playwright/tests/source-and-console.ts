import { Page, test } from "@playwright/test";

import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/source-and-console?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await openSourceTab(page);
  await addLogPoint(page, 12);

  await fillLogPointText(page, 12, "printError");
  const message = page.locator('[data-test-id="Message"]').first();
  const keyValue = message.locator("[data-test-id=Expandable]");
  await keyValue.click();

  await fillLogPointText(page, 12, "z");
});

async function openSourceTab(page: Page) {
  await page.goto(URL);

  await page.click('[data-test-id="SourceTab-test-console-levels.html"]');
}

async function addLogPoint(page: Page, lineNumber: number) {
  const selector = `[data-test-id="Source-test-console-levels.html"] [data-test-id="SourceLine-${lineNumber}"]`;
  await page.hover(selector);
  const button = page.locator(`${selector} button`);
  await button.click();
}

async function fillLogPointText(page: Page, lineNumber: number, text: string) {
  await page.fill(`[data-test-id="PointPanel-${lineNumber}"] input`, text);
  await page.keyboard.press("Enter");
}

test("should not allow saving invalid log point values", async ({ page }) => {
  await openSourceTab(page);
  await addLogPoint(page, 12);
  await fillLogPointText(page, 12, "'1");

  const pointPanel = page.locator('[data-test-id="PointPanel-12"]');
  await takeScreenshot(page, pointPanel, "point-panel-invalid");
});

test("should support log points that only require local analysis", async ({ page }) => {
  await openSourceTab(page);
  await addLogPoint(page, 12);

  const sourceRoot = page.locator('[data-test-id="SourcesRoot"]');
  await takeScreenshot(page, sourceRoot, "local-analysis-log-point-source");

  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "local-analysis-log-point-console");
});

test("should support log points that require remote analysis", async ({ page }) => {
  await openSourceTab(page);
  await addLogPoint(page, 12);
  await fillLogPointText(page, 12, "printError");

  const sourceRoot = page.locator('[data-test-id="SourcesRoot"]');
  await takeScreenshot(page, sourceRoot, "remote-analysis-log-point-source");

  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "remote-analysis-log-point-console");

  const message = page.locator('[data-test-id="Message"]').first();
  const keyValue = message.locator("[data-test-id=Expandable]");
  await keyValue.click();
  await takeScreenshot(page, message, "remote-analysis-log-point-expanded-console");
});

test("should gracefully handle invalid remote analysis", async ({ page }) => {
  await openSourceTab(page);
  await addLogPoint(page, 12);
  await fillLogPointText(page, 12, "z");

  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "invalid-remote-analysis-log-point-console");
});

test("should include log points in search results", async ({ page }) => {
  await openSourceTab(page);
  await addLogPoint(page, 12);

  await page.fill('[data-test-id="ConsoleSearchInput"]', "stack");
  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "log-point-highlighted-as-search-result");
});

test("should include log points when filtering data", async ({ page }) => {
  await openSourceTab(page);
  await addLogPoint(page, 12);

  await page.fill('[data-test-id="ConsoleFilterInput"]', "stack");
  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "log-point-in-search-results");

  await page.fill('[data-test-id="ConsoleFilterInput"]', "zzz");
  await takeScreenshot(page, messages, "log-point-not-in-search-results");
});
