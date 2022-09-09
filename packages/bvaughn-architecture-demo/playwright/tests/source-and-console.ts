import { Page, test } from "@playwright/test";

import { toggleProtocolMessages } from "./utils/console";
import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/source-and-console?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await addLogPoint(page, 13);

  await fillLogPointText(page, 13, "z");
  await fillLogPointText(page, 13, "printError");

  await toggleProtocolMessages(page, false);

  const message = page.locator("[data-test-name=Message]").first();
  const keyValue = message.locator("[data-test-name=Expandable]");
  await keyValue.click();

  await addLogPoint(page, 28);
  await fillLogPointText(page, 28, `"logsToPrint", logsToPrint`);
  await fillLogPointText(page, 28, `"logsToPrint", logsToPrint`, "logsToPrint <= 3");

  await addLogPoint(page, 68);
  await addLogPoint(page, 70);
});

async function addLogPoint(page: Page, lineNumber: number) {
  const selector = `[data-test-id="Source-source-and-console.html"] [data-test-id=SourceLine-${lineNumber}]`;
  await page.hover(selector);
  const button = page.locator(`${selector} button`);
  await button.click();
}

async function fillLogPointText(
  page: Page,
  lineNumber: number,
  content: string,
  condition: string = ""
) {
  await page.fill(`[data-test-id=PointPanelInput-${lineNumber}-content]`, content);
  await page.fill(`[data-test-id=PointPanelInput-${lineNumber}-condition]`, condition);
  await page.keyboard.press("Enter");
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(URL);

  await page.click("[data-test-id=SourceExplorerSource-h1]");
  await page.click("[data-test-id=SourceTab-h1]");
});

test("should not allow saving log points with invalid content", async ({ page }) => {
  await addLogPoint(page, 13);
  await fillLogPointText(page, 13, "'1");

  const pointPanel = page.locator("[data-test-id=PointPanel-13]");
  await takeScreenshot(page, pointPanel, "point-panel-invalid-content");
});

test("should not allow saving log points with invalid conditional", async ({ page }) => {
  await addLogPoint(page, 13);
  await fillLogPointText(page, 13, "true", "'1");

  const pointPanel = page.locator("[data-test-id=PointPanel-13]");
  await takeScreenshot(page, pointPanel, "point-panel-invalid-conditional");
});

test("should run local analysis for log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, 13);
  await fillLogPointText(page, 13, '"local", 123, true');

  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, message, "log-point-local-analysis");
});

test("should support new lines in log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, 13);
  await fillLogPointText(page, 13, '"one\\ntwo"');

  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, message, "log-point-with-new-lines");
});

test("should run remote analysis for log points", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, 13);
  await fillLogPointText(page, 13, "printError");

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
  await addLogPoint(page, 28);

  const messages = page.locator("[data-test-name=Messages]");

  await fillLogPointText(page, 28, `"logsToPrint", logsToPrint`);
  await takeScreenshot(page, messages, "log-point-multi-hits-console");

  await fillLogPointText(page, 28, `"logsToPrint", logsToPrint`, "logsToPrint <= 3");
  await takeScreenshot(page, messages, "log-point-multi-hits-with-conditional-console");
});

test("should gracefully handle invalid remote analysis", async ({ page }) => {
  await toggleProtocolMessages(page, false);
  await addLogPoint(page, 13);
  await fillLogPointText(page, 13, "z");

  const message = page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, message, "log-point-invalid-remote-analysis-console");
});

test("should include log points in search results", async ({ page }) => {
  await addLogPoint(page, 13);

  await page.fill("[data-test-id=ConsoleSearchInput]", "stack");
  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, messages, "log-point-highlighted-as-search-result");
});

test("should include log points when filtering data", async ({ page }) => {
  await addLogPoint(page, 13);

  await page.fill("[data-test-id=ConsoleFilterInput]", "stack");
  const messages = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, messages, "log-point-in-search-results");

  await page.fill("[data-test-id=ConsoleFilterInput]", "zzz");
  await takeScreenshot(page, messages, "log-point-not-in-search-results");
});

test("should support custom badge styles for log points", async ({ page }) => {
  await addLogPoint(page, 13);

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
  await addLogPoint(page, 68);

  const popup = page.locator('[data-test-id="PointPanel-68"]');
  await takeScreenshot(page, popup, "log-point-message-too-many-points-to-find");

  await toggleProtocolMessages(page, false);

  const messagesList = page.locator('[data-test-name="Messages"]');
  await takeScreenshot(page, messagesList, "log-point-empty-messages-list");
});

test("should handle too many points to run analysis", async ({ page }) => {
  await addLogPoint(page, 70);

  const popup = page.locator('[data-test-id="PointPanel-70"]');
  await takeScreenshot(page, popup, "log-point-message-too-many-points-to-run-analysis");

  await toggleProtocolMessages(page, false);

  const messagesList = page.locator('[data-test-name="Messages"]');
  await takeScreenshot(page, messagesList, "log-point-empty-messages-list");
});
