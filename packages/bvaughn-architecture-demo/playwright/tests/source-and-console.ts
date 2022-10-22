import { expect, test } from "@playwright/test";

import { toggleProtocolMessages, verifyConsoleMessage } from "./utils/console";
import { getTestUrl, takeScreenshot } from "./utils/general";
import {
  addBreakPoint,
  addLogPoint,
  getSourceFileNameSearchResultsLocator,
  goToLine,
  openSourceFile,
  searchSourcesByName,
  searchSourceText,
  getSearchSourceLocator,
  getSourceLocator,
  getPointPanelLocator,
  getSourceLineLocator,
  removeBreakPoint,
  removeLogPoint,
} from "./utils/source";
import testSetup from "./utils/testSetup";

testSetup("dbd4da74-cf42-41fb-851d-69bed67debcf");

const sourceId = "h1";

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("source-and-console"));
  await openSourceFile(page, "h1");
});

test("should not allow saving log points with invalid content", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13, content: "'1" });
  const pointPanelLocator = getPointPanelLocator(page, 13);
  await takeScreenshot(page, pointPanelLocator, "point-panel-invalid-content");
});

test("should not allow saving log points with invalid conditional", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13, condition: "'1" });
  const pointPanelLocator = getPointPanelLocator(page, 13);
  await takeScreenshot(page, pointPanelLocator, "point-panel-invalid-conditional");
});

test("should run local analysis for log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, {
    sourceId,
    lineNumber: 13,
    content: '"local", 123, true',
  });
  await verifyConsoleMessage(page, "local 123 true", "log-point", 1);
  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, message, "log-point-local-analysis");
});

test("should support new lines in log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 13, content: '"one\\ntwo"' });
  await verifyConsoleMessage(page, "two", "log-point", 1);
  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, message, "log-point-with-new-lines");
});

test("should run remote analysis for log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 13, content: "printError" });

  const sourceRoot = page.locator("[data-test-id=SourcesRoot]");
  await takeScreenshot(page, sourceRoot, "log-point-analysis-source");

  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, messages, "log-point-analysis-console");

  const message = page.locator("[data-test-name=Message]").first();
  const keyValue = message.locator("[data-test-name=Expandable]");
  await keyValue.click();
  await takeScreenshot(page, message, "log-point-analysis-expanded-console");
});

test("should support conditional log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 28 });

  const messages = page.locator("[data-test-name=Messages]");

  // TODO await fillLogPointText(page, 28, `"logsToPrint", logsToPrint`);
  await takeScreenshot(page, messages, "log-point-multi-hits-console");

  // TODO await fillLogPointText(page, 28, `"logsToPrint", logsToPrint`, "logsToPrint <= 3");
  await takeScreenshot(page, messages, "log-point-multi-hits-with-conditional-console");
});

test("should gracefully handle invalid remote analysis", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 13 });
  // TODO await fillLogPointText(page, 13, "z");

  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, message, "log-point-invalid-remote-analysis-console");
});

test("should include log points in search results", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  await page.fill("[data-test-id=ConsoleSearchInput]", "stack");
  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, messages, "log-point-highlighted-as-search-result");
});

test("should include log points when filtering data", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  await page.fill("[data-test-id=ConsoleFilterInput]", "stack");
  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, messages, "log-point-in-search-results");

  await page.fill("[data-test-id=ConsoleFilterInput]", "zzz");
  await takeScreenshot(page, messages, "log-point-not-in-search-results");
});

test("should support custom badge styles for log points", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 13 });

  await toggleProtocolMessages(page, false);

  const message = page.locator("[data-test-name=Message]");

  await message.click({ button: "right" });
  await page.click("[data-test-id=ConsoleContextMenu-Badge-yellow]");
  await takeScreenshot(page, message, "log-point-message-with-yellow-badge");

  await message.click({ button: "right" });
  await page.click("[data-test-id=ConsoleContextMenu-Badge-unicorn]");
  await takeScreenshot(page, message, "log-point-message-with-unicorn-badge");
});

test("should handle too many points to find", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 68 });

  const popup = page.locator('[data-test-id="PointPanel-68"]');
  await takeScreenshot(page, popup, "log-point-message-too-many-points-to-find");

  await toggleProtocolMessages(page, false);

  const messagesList = page.locator('[data-test-name="Messages"]');
  await takeScreenshot(page, messagesList, "log-point-empty-messages-list");
});

test("should handle too many points to run analysis", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 70 });

  const popup = page.locator('[data-test-id="PointPanel-70"]');
  await takeScreenshot(page, popup, "log-point-message-too-many-points-to-run-analysis");

  await toggleProtocolMessages(page, false);

  const messagesList = page.locator('[data-test-name="Messages"]');
  await takeScreenshot(page, messagesList, "log-point-empty-messages-list");
});

test("should support fuzzy file search", async ({ page }) => {
  const searchResultsLocator = getSourceFileNameSearchResultsLocator(page);
  await searchSourcesByName(page, "e");
  await takeScreenshot(page, searchResultsLocator, "fuzzy-search-results-with-3-matches");
  await searchSourcesByName(page, "source");
  await takeScreenshot(page, searchResultsLocator, "fuzzy-search-results-with-2-matches");
  await searchSourcesByName(page, "xyz");
  await expect(searchResultsLocator).not.toBeVisible();
});

test("should support jumping to a line in the active source file", async ({ page }) => {
  await openSourceFile(page, sourceId);
  await goToLine(page, 77);
  const sourceLocator = getSourceLocator(page, sourceId);
  await takeScreenshot(page, sourceLocator, "go-to-last-line");
  await goToLine(page, 1);
  await takeScreenshot(page, sourceLocator, "go-to-first-line");
});

test("should support text search in the active source file", async ({ page }) => {
  await openSourceFile(page, sourceId);
  const sourceSearchLocator = getSearchSourceLocator(page);
  await expect(sourceSearchLocator).not.toBeVisible();
  await searchSourceText(page, "function");
  await takeScreenshot(page, sourceSearchLocator, "source-search-results");
  await page.keyboard.press("Shift+Enter");
  await takeScreenshot(page, sourceSearchLocator, "source-search-last-result-active");
  await page.keyboard.press("Enter");
  await takeScreenshot(page, sourceSearchLocator, "source-search-first-result-active");
  await page.keyboard.press("Escape");
  await expect(sourceSearchLocator).not.toBeVisible();
});

test("should support break points", async ({ page }) => {
  const sourceLine = getSourceLineLocator(page, sourceId, 13);
  await takeScreenshot(page, sourceLine, "source-line-no-breakpoint");
  await addBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-with-breakpoint");
  await removeBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-no-breakpoint");
});

test("should not erase log point content when breaking is toggled", async ({ page }) => {
  const pointPanel = getPointPanelLocator(page, 13);
  await addLogPoint(page, { sourceId, lineNumber: 13, content: '"This is custom"' });
  await takeScreenshot(page, pointPanel, "point-panel-custom-content");
  await addBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, pointPanel, "point-panel-custom-content");
  await removeBreakPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, pointPanel, "point-panel-custom-content");
});

test("should not erase break point when logging is toggled", async ({ page }) => {
  const sourceLine = getSourceLineLocator(page, sourceId, 13);
  await addBreakPoint(page, { sourceId, lineNumber: 13 });
  await addLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-with-break-point-and-log-point-content");
  await removeLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, sourceLine, "source-line-with-break-point-only-content");
});
