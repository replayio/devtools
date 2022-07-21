import { test, expect } from "@playwright/test";

import { hideProtocolMessages, hideSearchInput, seekToMessage, showSearchInput } from "./utils/console";
import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/console?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await page.goto(URL);

  // Exploring Message values
  const warningListItem = page.locator('[data-test-name="Expandable"]', {
    hasText: "This is a warning",
  });
  const arrayKeyValue = warningListItem.locator("[data-test-name=Expandable]", {
    hasText: "Array",
  });
  await arrayKeyValue.click();

  const errorListItem = page.locator('[data-test-name="Expandable"]', {
    hasText: "This is an error",
  });
  let keyValue = errorListItem.locator("[data-test-name=Expandable]", { hasText: "foo" });
  keyValue.click();

  const children = errorListItem.locator("[data-test-name=ExpandableChildren]");
  const nestedKeyValue = children.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();

  // Terminal expressions
  const firstListItem = await page.locator("[data-test-name=Message]").first();
  await seekToMessage(page, firstListItem);

  await page.fill('[data-test-id="ConsoleTerminalInput"]', "location.href");
  await page.keyboard.press("Enter");

  await page.fill('[data-test-id="ConsoleTerminalInput"]', "+/");
  await page.keyboard.press("Enter");

  // Event type data
  await page.click('[date-test-id="EventCategoryHeader-Mouse"]');
  await page.click('[data-test-id="EventTypes-event.mouse.click"]');

  const eventTypeListItem = page.locator('[data-test-name="Expandable"]', {
    hasText: "MouseEvent",
  });
  keyValue = eventTypeListItem.locator('[data-test-id="KeyValue"]', { hasText: "MouseEvent" });
  await keyValue.click();
});

test("should display list of messages", async ({ page }) => {
  await page.goto(URL);

  const list = page.locator("[data-test-name=Messages]");
  await expect(list).toContainText("This is a log");
  await expect(list).toContainText("This is a warning");
  await expect(list).toContainText("This is an error");

  await takeScreenshot(page, list, "message-list");

  await page.click('[data-test-id="FilterToggle-showTimestamps"]');
  await takeScreenshot(page, list, "message-list-with-timestamps");
});

test("should display toggleable stack for errors", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator("[data-test-name=Message]", { hasText: "This is an error" });
  await takeScreenshot(page, listItem, "error-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is an error" });
  await toggle.click();
  await takeScreenshot(page, listItem, "error-stack-expanded");
});

test("should display toggleable stack for warnings", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator("[data-test-name=Message]", { hasText: "This is a warning" });
  await takeScreenshot(page, listItem, "warning-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is a warning" });
  await toggle.click();
  await takeScreenshot(page, listItem, "warning-stack-expanded");
});

test("should display toggleable stack for traces", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator("[data-test-name=Message]", { hasText: "This is a trace" });
  await takeScreenshot(page, listItem, "trace-stack-collapsed");

  const toggle = page.locator("[role=button]", { hasText: "This is a trace" });
  await toggle.click();
  await takeScreenshot(page, listItem, "trace-stack-expanded");
});

test("should expand and inspect arrays", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-name="Expandable"]', { hasText: "This is a warning" });
  await takeScreenshot(page, listItem, "array-collapsed");

  const keyValue = listItem.locator("[data-test-name=Expandable]", { hasText: "Array" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "array-expanded");
});

test("should expand and inspect objects", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator('[data-test-name="Expandable"]', { hasText: "This is an error" });
  await takeScreenshot(page, listItem, "object-collapsed");

  const keyValue = listItem.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "object-expanded");

  const children = listItem.locator("[data-test-name=ExpandableChildren]");
  const nestedKeyValue = children.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();
  await takeScreenshot(page, listItem, "nested-object-expanded");
});

test("should support seeking to a message execution point", async ({ page }) => {
  await page.goto(URL);

  const list = page.locator("[data-test-name=Messages]");

  // Fast-forward
  const lastListItem = await page.locator("[data-test-name=Message]").last();
  await seekToMessage(page, lastListItem);
  await takeScreenshot(page, list, "message-list-seek-to-last-message");

  // Fast-forward
  const firstListItem = await page.locator("[data-test-name=Message]").first();
  await seekToMessage(page, firstListItem);
  await takeScreenshot(page, list, "message-list-seek-to-first-message");
});

test("should show an add-comment button for the current message", async ({ page }) => {
  await page.goto(URL);

  const listItem = page.locator("[data-test-name=Message]", { hasText: "This is a log" });
  await takeScreenshot(page, listItem, "list-item");

  await listItem.hover();
  await takeScreenshot(page, listItem, "list-item-hovered");

  const fastForwardButton = page.locator('[data-test-id="ConsoleMessageHoverButton"]');
  await fastForwardButton.hover();
  await takeScreenshot(page, listItem, "fast-forward-button-hovered");

  await fastForwardButton.click();
  await takeScreenshot(page, listItem, "add-comment-button-hovered");

  await listItem.hover();
  await takeScreenshot(page, listItem, "list-item-current");
});

test("should show and hide search input when Enter and Escape are typed", async ({ page }) => {
  await page.goto(URL);

  // Search should be hidden
  let searchInput = page.locator('[data-test-id="ConsoleSearchInput"]');
  await expect(searchInput).toHaveCount(0);

  await showSearchInput(page);

  searchInput = page.locator('[data-test-id="ConsoleSearchInput"]');
  await takeScreenshot(page, searchInput, "search-input-visible-and-focused");

  await hideSearchInput(page);

  // Search should be hidden again
  searchInput = page.locator('[data-test-id="ConsoleSearchInput"]');
  await expect(searchInput).toHaveCount(0);

  const terminalInput = page.locator('[data-test-id="ConsoleTerminalInput"]');
  await takeScreenshot(page, terminalInput, "terminal-input-focused");
});

test("should be searchable", async ({ page }) => {
  await page.goto(URL);

  await showSearchInput(page);

  await page.fill('[data-test-id="ConsoleSearchInput"]', " an ");

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "searchable-single-result");

  await page.fill('[data-test-id="ConsoleSearchInput"]', " a ");
  await takeScreenshot(page, consoleRoot, "searchable-result-1-of-3");

  await page.click('[data-test-id="ConsoleSearchGoToNextButton"]');
  await page.click('[data-test-id="ConsoleSearchGoToNextButton"]');
  await takeScreenshot(page, consoleRoot, "searchable-result-3-of-3");

  await page.click('[data-test-id="ConsoleSearchGoToPreviousButton"]');
  await takeScreenshot(page, consoleRoot, "searchable-result-2-of-3");

  // Changes to filters should also update search results
  await page.fill('[data-test-id="ConsoleFilterInput"]', "warning");

  const searchResultsLabel = page.locator('[data-test-id="SearchResultsLabel"]');
  await takeScreenshot(page, searchResultsLabel, "searchable-result-updated-after-filter");
});

test("should be filterable", async ({ page }) => {
  await page.goto(URL);

  await page.fill('[data-test-id="ConsoleFilterInput"]', " an ");
  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "filtered-single-result");

  await page.fill('[data-test-id="ConsoleFilterInput"]', " a ");
  await takeScreenshot(page, consoleRoot, "filtered-three-results");

  await page.fill('[data-test-id="ConsoleFilterInput"]', "zzz");
  await takeScreenshot(page, consoleRoot, "filtered-no-results");
});

test("should log events in the console", async ({ page }) => {
  await page.goto(URL);

  await page.click('[date-test-id="EventCategoryHeader-Mouse"]');
  await page.click('[data-test-id="EventTypes-event.mouse.click"]');

  const listItem = page
    .locator('[data-test-name="Expandable"]', {
      hasText: "MouseEvent",
    })
    .first();
  await takeScreenshot(page, listItem, "event-types-mouse-click");

  await page.click('[data-test-id="FilterToggle-showTimestamps"]');
  await takeScreenshot(page, listItem, "event-types-mouse-click-with-timestamps");

  const keyValue = listItem.locator('[data-test-id="KeyValue"]', { hasText: "MouseEvent" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "event-types-mouse-click-with-timestamps-expanded");

  const filterToggles = page.locator('[data-test-id="ConsoleFilterToggles"]');

  await page.fill('[data-test-id="EventTypeFilterInput"]', "click");
  await takeScreenshot(page, filterToggles, "event-types-filtered-toggle-list");

  await page.fill('[data-test-id="EventTypeFilterInput"]', "zzz");
  await takeScreenshot(page, filterToggles, "event-types-filtered-toggle-list-no-results");
});

test("should be searchable on complex content", async ({ page }) => {
  await page.goto(URL);

  await showSearchInput(page);

  await page.fill('[data-test-id="ConsoleSearchInput"]', "Array(3) [1, 2, 3]");

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "searchable-complex-array-preview");

  await page.fill('[data-test-id="ConsoleSearchInput"]', "number: 123, string:");
  await takeScreenshot(page, consoleRoot, "searchable-complex-object-preview");
});

test("should be filterable on complex content", async ({ page }) => {
  await page.goto(URL);

  await page.fill('[data-test-id="ConsoleFilterInput"]', "Array(3) [1, 2, 3]");
  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "filtered-complex-array-preview");

  await page.fill('[data-test-id="ConsoleFilterInput"]', "number: 123, string:");
  await takeScreenshot(page, consoleRoot, "filtered-complex-object-preview");
});

test("should hide node_modules (and unpkg) if toggled", async ({ page }) => {
  await page.goto(URL);

  await page.click('[data-test-id="FilterToggle-errors"]');
  await page.click('[data-test-id="FilterToggle-exceptions"]');
  await page.click('[data-test-id="FilterToggle-logs"]');

  const list = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, list, "filtered-all-warnings");

  await page.click('[data-test-id="FilterToggle-hideNodeModules"]');
  await takeScreenshot(page, list, "filtered-all-warnings-no-node-modules");
});

test("should be able to toggle side filter menu open and closed", async ({ page }) => {
  await page.goto(URL);

  const consoleRoot = page.locator('[data-test-id="ConsoleRoot"]');
  await takeScreenshot(page, consoleRoot, "filters-side-menu-open");

  // Fill in filter text; this should be remembered when the side menu is re-opened.
  await page.fill('[data-test-id="EventTypeFilterInput"]', "test");

  await page.click('[date-test-id="ConsoleMenuToggleButton"]');
  await takeScreenshot(page, consoleRoot, "filters-side-menu-closed");

  await page.click('[date-test-id="ConsoleMenuToggleButton"]');
  await takeScreenshot(page, consoleRoot, "filters-side-menu-reopened");
});

test("should remember filter toggle preferences between reloads", async ({ page }) => {
  await page.goto(URL);

  // Toggle everything off and screenshot
  await page.click('[data-test-id="FilterToggle-errors"]');
  await page.click('[data-test-id="FilterToggle-exceptions"]');
  await page.click('[data-test-id="FilterToggle-logs"]');
  await page.click('[data-test-id="FilterToggle-warnings"]');
  let filters = page.locator('[data-test-id="ConsoleFilterToggles"]');
  await takeScreenshot(page, filters, "initial-side-filter-values");

  // Reload and verify screenshot unchanged
  await page.reload();
  filters = page.locator('[data-test-id="ConsoleFilterToggles"]');
  await takeScreenshot(page, filters, "initial-side-filter-values");

  // Toggle everything on and screenshot
  await page.click('[data-test-id="FilterToggle-errors"]');
  await page.click('[data-test-id="FilterToggle-exceptions"]');
  await page.click('[data-test-id="FilterToggle-logs"]');
  await page.click('[data-test-id="FilterToggle-warnings"]');
  await page.click('[data-test-id="FilterToggle-hideNodeModules"]');
  await page.click('[data-test-id="FilterToggle-showTimestamps"]');
  await takeScreenshot(page, filters, "updated-side-filter-values");

  // Reload and verify screenshot unchanged
  await page.reload();
  filters = page.locator('[data-test-id="ConsoleFilterToggles"]');
  await takeScreenshot(page, filters, "updated-side-filter-values");
});

test("should evaluate and render local terminal expressions", async ({ page }) => {
  await page.goto(URL);

  let firstListItem = await page.locator("[data-test-name=Message]").first();
  await seekToMessage(page, firstListItem);

  await page.fill('[data-test-id="ConsoleTerminalInput"]', "location.href");
  await page.keyboard.press("Enter");

  await hideProtocolMessages(page);

  firstListItem = await page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, firstListItem, "local-terminal-expression-valid");
});

test("should evaluate and render invalid local terminal expressions", async ({ page }) => {
  await page.goto(URL);

  let firstListItem = await page.locator("[data-test-name=Message]").first();
  await seekToMessage(page, firstListItem);

  await page.fill('[data-test-id="ConsoleTerminalInput"]', "+/");
  await page.keyboard.press("Enter");

  await hideProtocolMessages(page);

  firstListItem = await page.locator("[data-test-name=Message]").first();
  await takeScreenshot(page, firstListItem, "local-terminal-expression-valid");
});

// TODO (FE-337) Add tests for global expressions once pauseId issue is sorted out.
