import { test, expect, Page } from "@playwright/test";

import {
  hideSearchInput,
  locateMessage,
  seekToMessage,
  showSearchInput,
  toggleProtocolMessage,
  toggleProtocolMessages,
} from "./utils/console";
import { getBaseURL, getElementCount, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/console?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await setup(page, true);

  // Exploring Message values

  const warningListItem = await locateMessage(page, "console-warning", "This is a warning");
  const arrayKeyValue = warningListItem
    .locator("[data-test-name=Expandable]", {
      hasText: "(3)",
    })
    .last();
  await arrayKeyValue.click();

  const errorListItem = await locateMessage(page, "console-error", "This is an error");
  let keyValue = errorListItem.locator("[data-test-name=Expandable]", { hasText: "foo" }).last();
  await keyValue.click();

  const children = errorListItem.locator("[data-test-name=ExpandableChildren]");
  const nestedKeyValue = children.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();

  // Global terminal expressions
  await page.fill("[data-test-id=ConsoleTerminalInput]", "someUndefinedVariable");
  await page.keyboard.press("Enter");
  await page.fill("[data-test-id=ConsoleTerminalInput]", "+/");
  await page.keyboard.press("Enter");

  // Load Pause data for local expressions
  const firstListItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, firstListItem);
  await page.fill("[data-test-id=ConsoleTerminalInput]", "location.href");
  await page.keyboard.press("Enter");
  await page.fill("[data-test-id=ConsoleTerminalInput]", "+/");
  await page.keyboard.press("Enter");
  const lastListItem = await locateMessage(page, "console-log", "This is a trace");
  await seekToMessage(page, lastListItem);

  // Event type data
  await page.click("[data-test-id=EventCategoryHeader-Mouse]");
  await page.click('[data-test-id="EventTypes-event.mouse.click"]');
  const eventTypeListItem = await locateMessage(page, "event", "MouseEvent");
  keyValue = eventTypeListItem.locator("[data-test-name=KeyValue]", { hasText: "MouseEvent" });
  await keyValue.click();
});

async function setup(page: Page, toggleState: boolean | null = null) {
  await page.goto(URL);

  if (typeof toggleState === "boolean") {
    await toggleProtocolMessages(page, toggleState);
    await toggleProtocolMessage(page, "nodeModules", toggleState);
  }

  await toggleProtocolMessage(page, "timestamps", false);
}

test("should display list of messages", async ({ page }) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");
  await expect(list).toContainText("This is a log");
  await expect(list).toContainText("This is a warning");
  await expect(list).toContainText("This is an error");
  await expect(list).toContainText("Uncaught exception");
  await toggleProtocolMessage(page, "timestamps", false);

  await takeScreenshot(page, list, "message-list");

  await toggleProtocolMessage(page, "timestamps", true);
  await takeScreenshot(page, list, "message-list-with-timestamps");
});

test("should display toggleable stack for errors", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error");
  await takeScreenshot(page, listItem, "error-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "This is an error" });
  await toggle.click();
  await takeScreenshot(page, listItem, "error-stack-expanded");
});

test("should display toggleable stack for warnings", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "warnings", true);

  const listItem = await locateMessage(page, "console-warning", "This is a warning");
  await takeScreenshot(page, listItem, "warning-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "This is a warning" });
  await toggle.click();
  await takeScreenshot(page, listItem, "warning-stack-expanded");
});

test("should display toggleable stack for traces", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a trace");
  await takeScreenshot(page, listItem, "trace-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "This is a trace" });
  await toggle.click();
  await takeScreenshot(page, listItem, "trace-stack-expanded");
});

test("should display toggleable stack for exceptions", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "exceptions", true);

  const listItem = await locateMessage(page, "exception", "Another uncaught exception");
  await takeScreenshot(page, listItem, "uncaught-exception-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "Another uncaught exception" });
  await toggle.click();
  await takeScreenshot(page, listItem, "uncaught-exception-stack-expanded");
});

test("should expand and inspect arrays", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "warnings", true);

  const listItem = await locateMessage(page, "console-warning", "This is a warning");
  await takeScreenshot(page, listItem, "array-collapsed", 1);

  const outer = listItem.locator("[data-test-name=Expandable]", { hasText: "This is a warning" });
  const keyValue = outer.locator("[data-test-name=Expandable]", { hasText: "(3)" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "array-expanded", 1);
});

test("should expand and inspect objects", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error");
  await takeScreenshot(page, listItem, "object-collapsed");

  const outer = listItem.locator("[data-test-name=Expandable]", { hasText: "This is an error" });
  const keyValue = outer.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "object-expanded");

  const nestedKeyValue = keyValue.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await nestedKeyValue.click();
  await takeScreenshot(page, listItem, "nested-object-expanded");
});

test("should support seeking to a message execution point", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const list = page.locator("[data-test-name=Messages]");

  // Fast-forward
  const laterListItem = await locateMessage(page, "console-log", "This is a trace");
  await seekToMessage(page, laterListItem);
  await takeScreenshot(page, list, "message-list-seek-to-later-message");

  // Rewind
  const earlierListItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, earlierListItem);
  await takeScreenshot(page, list, "message-list-seek-to-earlier-message");
});

// This test doesn't work currently because the "add comment" button is disabled when there's no accessToken.
// test("should show an add-comment button for the current message", async ({ page }) => {
//   await setup(page);
//
//   await toggleProtocolMessage(page, "logs", true);
//
//   const listItem = await locateMessage(page, "console-log",  "This is a log");
//   await takeScreenshot(page, listItem, "list-item");
//
//   await listItem.hover();
//   await takeScreenshot(page, listItem, "list-item-hovered");
//
//   const fastForwardButton = listItem.locator("[data-test-id=ConsoleMessageHoverButton]");
//   await fastForwardButton.hover();
//   await takeScreenshot(page, listItem, "fast-forward-button-hovered");
//
//   await fastForwardButton.click();
//   await takeScreenshot(page, listItem, "add-comment-button-hovered");
//
//   await listItem.hover();
//   await takeScreenshot(page, listItem, "list-item-current");
// });

test("should show and hide search input when Enter and Escape are typed", async ({ page }) => {
  await setup(page, true);

  // Search should be hidden
  let searchInput = page.locator("[data-test-id=ConsoleSearchInput]");
  await expect(searchInput).toHaveCount(0);

  await showSearchInput(page);

  searchInput = page.locator("[data-test-id=ConsoleSearchInput]");
  await takeScreenshot(page, searchInput, "search-input-visible-and-focused");

  await hideSearchInput(page);

  // Search should be hidden again
  searchInput = page.locator("[data-test-id=ConsoleSearchInput]");
  await expect(searchInput).toHaveCount(0);

  const terminalInput = page.locator("[data-test-id=ConsoleTerminalInput]");
  await takeScreenshot(page, terminalInput, "terminal-input-focused");
});

test("should be searchable", async ({ page }) => {
  await setup(page, true);

  await showSearchInput(page);

  await page.fill("[data-test-id=ConsoleSearchInput]", " an ");

  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, consoleRoot, "searchable-single-result");

  await page.fill("[data-test-id=ConsoleSearchInput]", " a ");
  await takeScreenshot(page, consoleRoot, "searchable-result-1-of-3");

  await page.click("[data-test-id=ConsoleSearchGoToNextButton]");
  await page.click("[data-test-id=ConsoleSearchGoToNextButton]");
  await takeScreenshot(page, consoleRoot, "searchable-result-3-of-3");

  await page.click("[data-test-id=ConsoleSearchGoToPreviousButton]");
  await takeScreenshot(page, consoleRoot, "searchable-result-2-of-3");

  // Changes to filters should also update search results
  await page.fill("[data-test-id=ConsoleFilterInput]", "warning");

  const searchResultsLabel = page.locator("[data-test-id=SearchResultsLabel]");
  await takeScreenshot(page, searchResultsLabel, "searchable-result-updated-after-filter");
});

test("should be filterable", async ({ page }) => {
  await setup(page, true);

  await page.fill("[data-test-id=ConsoleFilterInput]", " an ");
  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, consoleRoot, "filtered-single-result");

  await page.fill("[data-test-id=ConsoleFilterInput]", " a ");
  await takeScreenshot(page, consoleRoot, "filtered-three-results");

  await page.fill("[data-test-id=ConsoleFilterInput]", "zzz");
  await takeScreenshot(page, consoleRoot, "filtered-no-results");
});

test("should log events in the console", async ({ page }) => {
  await setup(page);

  await page.click("[data-test-id=EventCategoryHeader-Mouse]");
  await page.click('[data-test-id="EventTypes-event.mouse.click"]');

  const listItem = await locateMessage(page, "event", "MouseEvent");
  await takeScreenshot(page, listItem, "event-types-mouse-click");

  await toggleProtocolMessage(page, "timestamps", true);
  await takeScreenshot(page, listItem, "event-types-mouse-click-with-timestamps");

  const keyValue = listItem.locator("[data-test-name=KeyValue]", { hasText: "MouseEvent" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "event-types-mouse-click-with-timestamps-expanded");

  const filterToggles = page.locator("[data-test-id=ConsoleFilterToggles]");

  await page.fill("[data-test-id=EventTypeFilterInput]", "click");
  await takeScreenshot(page, filterToggles, "event-types-filtered-toggle-list");

  await page.fill("[data-test-id=EventTypeFilterInput]", "zzz");
  await takeScreenshot(page, filterToggles, "event-types-filtered-toggle-list-no-results");
});

test("should be searchable on complex content", async ({ page }) => {
  await setup(page, true);

  await showSearchInput(page);

  await page.fill("[data-test-id=ConsoleSearchInput]", "(3) [1, 2, 3]");

  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, consoleRoot, "searchable-complex-array-preview");

  await page.fill("[data-test-id=ConsoleSearchInput]", "number: 123, string:");
  await takeScreenshot(page, consoleRoot, "searchable-complex-object-preview");
});

test("should be filterable on complex content", async ({ page }) => {
  await setup(page, true);

  await page.fill("[data-test-id=ConsoleFilterInput]", "(3) [1, 2, 3]");
  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, consoleRoot, "filtered-complex-array-preview");

  await page.fill("[data-test-id=ConsoleFilterInput]", "number: 123, string:");
  await takeScreenshot(page, consoleRoot, "filtered-complex-object-preview");
});

test("should hide node_modules (and unpkg) if toggled", async ({ page }) => {
  await setup(page, false);
  await toggleProtocolMessage(page, "warnings", true);
  await toggleProtocolMessage(page, "nodeModules", true);

  const list = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, list, "filtered-all-warnings");

  await toggleProtocolMessage(page, "nodeModules", false);
  await takeScreenshot(page, list, "filtered-all-warnings-no-node-modules");
});

test("should be able to toggle side filter menu open and closed", async ({ page }) => {
  await setup(page, false);

  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, consoleRoot, "filters-side-menu-open");

  // Fill in filter text; this should be remembered when the side menu is re-opened.
  await page.fill("[data-test-id=EventTypeFilterInput]", "test");

  await page.click("[data-test-id=ConsoleMenuToggleButton]");
  await takeScreenshot(page, consoleRoot, "filters-side-menu-closed");

  await page.click("[data-test-id=ConsoleMenuToggleButton]");
  await takeScreenshot(page, consoleRoot, "filters-side-menu-reopened");
});

test("should remember filter toggle preferences between reloads", async ({ page }) => {
  await setup(page);

  // Toggle everything off and screenshot
  await toggleProtocolMessages(page, false);
  await toggleProtocolMessage(page, "nodeModules", false);
  await toggleProtocolMessage(page, "timestamps", false);
  let filters = page.locator("[data-test-id=ConsoleFilterToggles]");
  await takeScreenshot(page, filters, "initial-side-filter-values");

  // Reload and verify screenshot unchanged
  await page.reload();
  filters = page.locator("[data-test-id=ConsoleFilterToggles]");
  await takeScreenshot(page, filters, "initial-side-filter-values");

  // Toggle everything on and screenshot
  await toggleProtocolMessages(page, true);
  await toggleProtocolMessage(page, "nodeModules", true);
  await toggleProtocolMessage(page, "timestamps", true);
  await takeScreenshot(page, filters, "updated-side-filter-values");

  // Reload and verify screenshot unchanged
  await page.reload();
  filters = page.locator("[data-test-id=ConsoleFilterToggles]");
  await takeScreenshot(page, filters, "updated-side-filter-values");
});

test("should evaluate terminal expressions at an execution point", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "location.href");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "terminal-expression-at-execution-point");
});

test("should evaluate terminal expressions without an execution point", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "someUndefinedVariable");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "global-terminal-expression-valid");
});

test("should evaluate and render invalid terminal expressions", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "+/");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "global-terminal-expression-invalid");
});

test("should show a button to clear terminal expressions", async ({ page }) => {
  await setup(page);

  await toggleProtocolMessage(page, "logs", true);

  let firstListItem = await page.locator("[data-test-name=Message]").first();
  await seekToMessage(page, firstListItem);

  await toggleProtocolMessages(page, false);

  // Add some expressions
  await page.fill("[data-test-id=ConsoleTerminalInput]", "location.href");
  await page.keyboard.press("Enter");
  await page.fill("[data-test-id=ConsoleTerminalInput]", "+/");
  await page.keyboard.press("Enter");

  expect(await getElementCount(page, "[data-test-name=Message]")).toBe(2);
  expect(await getElementCount(page, "[data-test-id=ClearConsoleEvaluationsButton]")).toBe(1);

  // Click the button to clear them
  await page.click("[data-test-id=ClearConsoleEvaluationsButton]");

  // Verify an empty terminal
  expect(await getElementCount(page, "[data-test-name=Message]")).toBe(0);
  expect(await getElementCount(page, "[data-test-id=ClearConsoleEvaluationsButton]")).toBe(0);
});

// TODO Add context menu test for setting focus range
// TODO Add context menu test for setting log point badge colors
