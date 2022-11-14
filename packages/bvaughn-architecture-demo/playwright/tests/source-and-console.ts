import { expect, test } from "@playwright/test";

import { toggleProtocolMessages, verifyConsoleMessage } from "./utils/console";
import { delay, getTestUrl, takeScreenshot, waitFor } from "./utils/general";
import {
  addBreakPoint,
  addLogPoint,
  clearSearchResult,
  editLogPoint,
  getPointPanelContentAutoCompleteListLocator,
  getPointPanelLocator,
  getSearchSourceLocator,
  getSourceFileNameSearchResultsLocator,
  getSourceLineLocator,
  getSourceLocator,
  getSourceSearchResultsLabelLocator,
  goToLine,
  goToNextHitPoint,
  goToNextSourceSearchResult,
  goToPreviousHitPoint,
  goToPreviousSourceSearchResult,
  openSourceFile,
  removeBreakPoint,
  removeLogPoint,
  searchSourceText,
  searchSourcesByName,
  toggleLogPointBadge,
  verifyHitPointButtonsEnabled,
  verifyLogPointStep,
} from "./utils/source";
import testSetup from "./utils/testSetup";

testSetup("dbd4da74-cf42-41fb-851d-69bed67debcf");

const sourceId = "h1";
const altSourceId = "1";

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("source-and-console"));
  await openSourceFile(page, sourceId);
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

test("should auto-suggestion text based on the current expression", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, { sourceId, lineNumber: 28 });

  // Select a pause and frame so auto-complete will work.
  await goToNextHitPoint(page, 28);

  await editLogPoint(page, { sourceId, lineNumber: 28, content: "win", saveAfterEdit: false });

  const autoCompleteList = getPointPanelContentAutoCompleteListLocator(page, 28);
  await waitFor(async () => expect(await autoCompleteList.isVisible()).toBe(true));
  await takeScreenshot(page, autoCompleteList, "log-point-auto-complete-list-window");

  // Select the 1st suggestion in the list: window
  await page.keyboard.press("Enter");
  const pointPanelLocator = getPointPanelLocator(page, 28);
  await takeScreenshot(page, pointPanelLocator, "log-point-auto-complete-text-window");

  await editLogPoint(page, {
    sourceId,
    lineNumber: 28,
    content: "window.loc",
    saveAfterEdit: false,
  });
  await waitFor(async () => expect(await autoCompleteList.isVisible()).toBe(true));
  await takeScreenshot(page, autoCompleteList, "log-point-auto-complete-list-window.loc");

  // Select the 1st suggestion in the list: location
  await page.keyboard.press("Enter");
  await takeScreenshot(page, pointPanelLocator, "log-point-auto-complete-text-window.location");
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

  const popup = getPointPanelLocator(page, 68);
  await takeScreenshot(page, popup, "log-point-message-too-many-points-to-find");
});

test("should handle too many points to run analysis", async ({ page }) => {
  await addLogPoint(page, { sourceId, lineNumber: 70 });

  // Give the analysis a little extra time to run.
  await delay(1000);

  const popup = getPointPanelLocator(page, 70);
  await takeScreenshot(page, popup, "log-point-message-too-many-points-to-run-analysis");
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
  await goToLine(page, sourceId, 77);
  const sourceLocator = getSourceLocator(page, sourceId);
  await takeScreenshot(page, sourceLocator, "go-to-last-line");
  await goToLine(page, sourceId, 1);
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

test("should remember search results and current index per source", async ({ page }) => {
  await openSourceFile(page, sourceId);
  const resultsLabel = getSourceSearchResultsLabelLocator(page);
  await searchSourceText(page, "function");
  await expect(await resultsLabel.textContent()).toBe("1 of 5 results");
  await goToNextSourceSearchResult(page);
  await goToNextSourceSearchResult(page);
  await expect(await resultsLabel.textContent()).toBe("3 of 5 results");

  await openSourceFile(page, altSourceId);
  await expect(await resultsLabel.textContent()).toBe("1 of 20 results");
  await goToNextSourceSearchResult(page);
  await goToNextSourceSearchResult(page);
  await goToNextSourceSearchResult(page);
  await expect(await resultsLabel.textContent()).toBe("4 of 20 results");

  await openSourceFile(page, sourceId);
  await expect(await resultsLabel.textContent()).toBe("3 of 5 results");
  await goToPreviousSourceSearchResult(page);
  await expect(await resultsLabel.textContent()).toBe("2 of 5 results");

  await openSourceFile(page, altSourceId);
  await expect(await resultsLabel.textContent()).toBe("4 of 20 results");

  await clearSearchResult(page);
  await expect(await resultsLabel.isVisible()).toBe(false);
  await openSourceFile(page, sourceId);
  await expect(await resultsLabel.isVisible()).toBe(false);
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

/* TODO
   Make this test pass in Docker; it passes in OSX (headless or regular Chrome)
test("should support continue to next and previous functionality", async ({ page }) => {
  // Continue to next should be enabled initially;
  // Continue to previous should not be.
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 14)).toBe(true);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 14)).toBe(false);

  // Go to line 14.
  await expect(await isLineCurrentExecutionPoint(page, 14)).toBe(false);
  await continueTo(page, { lineNumber: 14, direction: "next", sourceId });
  await expect(await isLineCurrentExecutionPoint(page, 14)).toBe(true);

  // Continue to next and previous buttons should both now be disabled for line 14.
  // Continue to previous should be enabled for line 13
  // And continue to next should be enabled for line 15.
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 13)).toBe(false);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 13)).toBe(true);
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 14)).toBe(false);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 14)).toBe(false);
  await expect(await isContinueToNextButtonEnabled(page, sourceId, 15)).toBe(true);
  await expect(await isContinueToPreviousButtonEnabled(page, sourceId, 15)).toBe(false);
});
*/

test("should allow log point badge colors to be toggled", async ({ page }) => {
  const pointPanelLocator = getPointPanelLocator(page, 13);
  await addLogPoint(page, { sourceId, lineNumber: 13 });
  await takeScreenshot(page, pointPanelLocator, "point-panel-default-badge");
  await toggleLogPointBadge(page, { sourceId, lineNumber: 13, badge: "green" });
  await takeScreenshot(page, pointPanelLocator, "point-panel-green-badge");
  await toggleLogPointBadge(page, { sourceId, lineNumber: 13, badge: "unicorn" });
  await takeScreenshot(page, pointPanelLocator, "point-panel-unicorn-badge");
  await toggleLogPointBadge(page, { sourceId, lineNumber: 13, badge: null });
  await takeScreenshot(page, pointPanelLocator, "point-panel-default-badge");
});

test("scroll position should be restored when switching between sources", async ({ page }) => {
  // Scroll to the bottom of source 1
  await openSourceFile(page, sourceId);
  await goToLine(page, sourceId, 77);
  const line77 = getSourceLineLocator(page, sourceId, 77);
  await expect(await line77.isVisible()).toBe(true);

  // Open source 2 and scroll to the middle
  await openSourceFile(page, altSourceId);
  await goToLine(page, altSourceId, 100);
  const line100 = getSourceLineLocator(page, altSourceId, 100);
  await expect(await line100.isVisible()).toBe(true);

  // Switch back and verify that we're still at the bottom of source 1
  await openSourceFile(page, sourceId);
  await expect(await line77.isVisible()).toBe(true);

  // Switch back and verify that we're still in the middle of source 2
  await openSourceFile(page, altSourceId);
  await expect(await line100.isVisible()).toBe(true);
});

/* TODO – This tests passes in OSX but not in Docker
test("should update the current time when the log point timeline is clicked", async ({
  page,
}) => {
  const lineNumber = 52;

  await addLogPoint(page, { lineNumber, sourceId });
  await verifyLogPointStep(page, "8", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });

  await goToLogPointTimelineTime(page, lineNumber, 0.35);
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: true,
    nextEnabled: true,
  });
});
*/

test("should update the current time when the next/previous log point buttons are clicked", async ({
  page,
}) => {
  const lineNumber = 30;

  await addLogPoint(page, { lineNumber, sourceId });
  await verifyLogPointStep(page, "2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });

  await goToNextHitPoint(page, lineNumber);
  await verifyLogPointStep(page, "1 / 2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });

  await goToNextHitPoint(page, lineNumber);
  await verifyLogPointStep(page, "2 / 2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: true,
    nextEnabled: false,
  });

  await goToPreviousHitPoint(page, lineNumber);
  await verifyLogPointStep(page, "1 / 2", { lineNumber, sourceId });
  await verifyHitPointButtonsEnabled(page, {
    lineNumber,
    previousEnabled: false,
    nextEnabled: true,
  });
});
