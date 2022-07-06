import { test, expect } from "@playwright/test";

import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/console?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await page.goto(URL);

  const warningListItem = page.locator('[data-test-id="Expandable"]', {
    hasText: "This is a warning",
  });
  const arrayKeyValue = warningListItem.locator("[data-test-id=Expandable]", { hasText: "Array" });
  await arrayKeyValue.click();

  const errorListItem = page.locator('[data-test-id="Expandable"]', {
    hasText: "This is an error",
  });
  const keyValue = errorListItem.locator("[data-test-id=Expandable]", { hasText: "foo" });
  await keyValue.click();

  const children = errorListItem.locator("[data-test-id=ExpandableChildren]");
  const nestedKeyValue = children.locator("[data-test-id=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();
});

test("should display list of messages", async ({ page }) => {
  await page.goto(URL);

  const list = page.locator('[data-test-id="Messages"]');
  await expect(list).toContainText("This is a log");
  await expect(list).toContainText("This is a warning");
  await expect(list).toContainText("This is an error");

  await takeScreenshot(page, list, "message-list");
});

test("should display toggleable stack for errors", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is an error" });
  await takeScreenshot(page, listItem, "error-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is an error" });
  await toggle.click();
  await takeScreenshot(page, listItem, "error-stack-expanded");
});

test("should display toggleable stack for warnings", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is a warning" });
  await takeScreenshot(page, listItem, "warning-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is a warning" });
  await toggle.click();
  await takeScreenshot(page, listItem, "warning-stack-expanded");
});

test("should display toggleable stack for traces", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is a trace" });
  await takeScreenshot(page, listItem, "trace-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is a trace" });
  await toggle.click();
  await takeScreenshot(page, listItem, "trace-stack-expanded");
});

test("should expand and inspect arrays", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Expandable"]', { hasText: "This is a warning" });
  await takeScreenshot(page, listItem, "array-collapsed");

  const keyValue = listItem.locator("[data-test-id=Expandable]", { hasText: "Array" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "array-expanded");
});

test("should expand and inspect objects", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Expandable"]', { hasText: "This is an error" });
  await takeScreenshot(page, listItem, "object-collapsed");

  const keyValue = listItem.locator("[data-test-id=Expandable]", { hasText: "foo" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "object-expanded");

  const children = listItem.locator("[data-test-id=ExpandableChildren]");
  const nestedKeyValue = children.locator("[data-test-id=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();
  await takeScreenshot(page, listItem, "nested-object-expanded");
});

test("should show support fast-forwarding to the message pause-point", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-id="Message"]', { hasText: "This is a log" });
  await takeScreenshot(page, listItem, "list-item");

  await listItem.hover();
  await takeScreenshot(page, listItem, "list-item-hovered");

  const fastForwardButton = page.locator('[data-test-id="FastForwardButton"]');
  await fastForwardButton.hover();
  await takeScreenshot(page, listItem, "fast-forward-button-hovered");

  await fastForwardButton.click();
  await takeScreenshot(page, listItem, "add-comment-button-hovered");

  await listItem.hover();
  await takeScreenshot(page, listItem, "list-item-current");
});

test("should be searchable", async ({ page }) => {
  await page.goto(URL);

  await page.fill('[data-test-id="ConsoleSearchInput"]', "an");

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "searchable-single-result");

  await page.fill('[data-test-id="ConsoleSearchInput"]', "a ");
  await takeScreenshot(page, consoleRoot, "searchable-result-1-of-3");

  await page.click('[data-test-id="ConsoleSearchGoToNextButton"]');
  await page.click('[data-test-id="ConsoleSearchGoToNextButton"]');
  await takeScreenshot(page, consoleRoot, "searchable-result-3-of-3");

  await page.click('[data-test-id="ConsoleSearchGoToPreviousButton"]');
  await takeScreenshot(page, consoleRoot, "searchable-result-2-of-3");
});

test("should be filterable", async ({ page }) => {
  await page.goto(URL);

  await page.fill('[data-test-id="ConsoleFilterInput"]', "an");
  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "filtered-single-result");

  await page.fill('[data-test-id="ConsoleFilterInput"]', "a ");
  await takeScreenshot(page, consoleRoot, "filtered-three-results");

  await page.fill('[data-test-id="ConsoleFilterInput"]', "zzz");
  await takeScreenshot(page, consoleRoot, "filtered-no-results");
});

// TODO Add tests:
// For fast-forwarding to a message.
