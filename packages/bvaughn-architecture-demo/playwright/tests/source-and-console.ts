import { test, expect } from "@playwright/test";

import { getBaseURL, takeScreenshot } from "./utils/general";

const URL = `${getBaseURL()}/tests/source-and-console`;

test("should not allow saving invalid log point values", async ({ page }) => {
  await page.goto(URL);

  await page.hover('[data-test-id="SourceLine11"]');
  const button = page.locator('[data-test-id="SourceLine11"] button');
  await button.click();

  await page.fill('[data-test-id="PointPanel11"] input', "'1");
  const PointPanel = page.locator('[data-test-id="PointPanel11"]');
  await takeScreenshot(page, PointPanel, "point-panel-invalid");
});

test("should support log points that only require local analysis", async ({ page }) => {
  await page.goto(URL);

  await page.hover('[data-test-id="SourceLine11"]');
  const button = page.locator('[data-test-id="SourceLine11"] button');
  await button.click();

  const sourceRoot = page.locator('[data-test-id="SourcesRoot"]');
  await takeScreenshot(page, sourceRoot, "local-analysis-log-point-source");

  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "local-analysis-log-point-console");
});

test("should support log points that require remote analysis", async ({ page }) => {
  await page.goto(URL);

  await page.hover('[data-test-id="SourceLine11"]');
  const button = page.locator('[data-test-id="SourceLine11"] button');
  await button.click();

  await page.fill('[data-test-id="PointPanel11"] input', "foo");
  await page.keyboard.press("Enter");

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
  await page.goto(URL);

  await page.hover('[data-test-id="SourceLine11"]');
  const button = page.locator('[data-test-id="SourceLine11"] button');
  await button.click();

  await page.fill('[data-test-id="PointPanel11"] input', "z");
  await page.keyboard.press("Enter");

  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "invalid-remote-analysis-log-point-console");
});

test("should include log points in search results", async ({ page }) => {
  await page.goto(URL);

  await page.hover('[data-test-id="SourceLine11"]');
  const button = page.locator('[data-test-id="SourceLine11"] button');
  await button.click();

  await page.fill('[data-test-id="ConsoleSearchInput"]', "stack");
  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "log-point-highlighted-as-search-result");
});

test("should include log points when filtering data", async ({ page }) => {
  await page.goto(URL);

  await page.hover('[data-test-id="SourceLine11"]');
  const button = page.locator('[data-test-id="SourceLine11"] button');
  await button.click();

  await page.fill('[data-test-id="ConsoleFilterInput"]', "stack");
  const messages = page.locator('[data-test-id="Messages"]');
  await takeScreenshot(page, messages, "log-point-in-search-results");

  await page.fill('[data-test-id="ConsoleFilterInput"]', "zzz");
  await takeScreenshot(page, messages, "log-point-not-in-search-results");
});
