import { Page, expect, test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import {
  addTerminalExpression,
  getConsoleInput,
  getConsoleSearchInput,
  hideSearchInput,
  locateMessage,
  messageLocator,
  openContextMenu,
  seekToMessage,
  showSearchInput,
  toggleProtocolMessage,
  toggleProtocolMessages,
  toggleSideMenu,
  verifyTypeAheadContainsSuggestions,
} from "./utils/console";
import {
  delay,
  getCommandKey,
  getElementCount,
  getTestUrl,
  stopHovering,
  takeScreenshot,
} from "./utils/general";
import testSetup from "./utils/testSetup";

testSetup("4ccc9f9f-f0d3-4418-ac21-1b316e462a44");

async function setup(page: Page, toggleState: boolean | null = null) {
  await page.goto(getTestUrl("console"));

  if (typeof toggleState === "boolean") {
    await toggleProtocolMessages(page, toggleState);
    await toggleProtocolMessage(page, "nodeModules", toggleState);
  }

  await toggleProtocolMessage(page, "timestamps", false);
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);
});

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

// 27a42866-ffd6-4f74-8813-c4feb2b78b6c
test("should show error object stacks by default", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error object");
  await takeScreenshot(page, listItem, "error-object-stack");

  const toggle = listItem.locator("[role=button]", { hasText: "This is an error object" });
  await toggle.click();
  await takeScreenshot(page, listItem, "error-object-stack-expanded");
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
  await takeScreenshot(page, listItem, "array-collapsed");

  const outer = listItem.locator("[data-test-name=Expandable]", { hasText: "This is a warning" });
  const keyValue = outer.locator("[data-test-name=Expandable]", { hasText: "(3) [" });
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });
  await takeScreenshot(page, listItem, "array-expanded");
});

test("should expand and inspect objects", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error");
  await takeScreenshot(page, listItem, "object-collapsed");

  const outer = listItem.locator("[data-test-name=Expandable]", { hasText: "This is an error" });
  const keyValue = outer.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });
  await takeScreenshot(page, listItem, "object-expanded");

  const nestedKeyValue = keyValue.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: nestedKeyValue,
  });
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

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

  // Search should be hidden
  let searchInput = getConsoleSearchInput(page);
  await expect(searchInput).toHaveCount(0);

  await showSearchInput(page);

  searchInput = getConsoleSearchInput(page);
  await takeScreenshot(page, searchInput, "search-input-visible-and-focused");

  await hideSearchInput(page);

  // Search should be hidden again
  searchInput = getConsoleSearchInput(page);
  await expect(searchInput).toHaveCount(0);

  const terminalInput = page.locator("[data-test-id=ConsoleTerminalInput]");
  await takeScreenshot(page, terminalInput, "terminal-input-focused");
});

test("should re-focus the search input when CMD+F is used again", async ({ page }) => {
  await setup(page);

  await showSearchInput(page);

  const searchInput = getConsoleSearchInput(page);
  await expect(searchInput).toHaveCount(1);
  await expect(searchInput).toBeFocused();
});

test("should re-focus the terminal input when search input is hidden", async ({ page }) => {
  await setup(page);

  const consoleInput = getConsoleInput(page);
  const searchInput = getConsoleSearchInput(page);

  await showSearchInput(page);
  await expect(searchInput).toBeFocused();

  await hideSearchInput(page);
  await expect(consoleInput).toBeFocused();
});

test("should be searchable", async ({ page }) => {
  await setup(page, true);

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

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

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

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

  // The filters menu should be open by default.
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toHaveCount(1);

  // Fill in filter text; this should be remembered when the side menu is re-opened.
  await page.fill("[data-test-id=EventTypeFilterInput]", "test");

  // Verify that we can close it.
  await toggleSideMenu(page, false);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeHidden();

  // Verify that we can re-open it and the same filter text will still be there.
  await toggleSideMenu(page, true);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeVisible();
  const text = await page.locator("[data-test-id=EventTypeFilterInput]").inputValue();
  expect(text).toBe("test");

  // Close again and verify that the setting is remembered between page reloads.
  await toggleSideMenu(page, false);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeHidden();
  await page.reload();
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeHidden();

  // Re-open and verify that the setting is remembered between page reloads.
  await toggleSideMenu(page, true);
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-test-id=ConsoleFilterToggles]")).toBeVisible();
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

  await page.fill("[data-test-id=ConsoleTerminalInput]", "location.hre");
  await delay(500); // HACK Give the type-ahead data time to load
  await page.keyboard.press("Enter"); // Accept "href" suggestion
  await page.keyboard.press("Enter"); // Submit expression

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "terminal-expression-at-execution-point");
});

test("should suggest type-ahead options from prototype objects as well", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "window.location.propertyIs");
  await delay(500); // HACK Give the type-ahead data time to load
  await page.keyboard.press("Enter"); // Accept suggestion
  await page.keyboard.press("Enter"); // Submit expression

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(
    page,
    newListItem,
    "terminal-expression-at-execution-point-with-parent-property"
  );
});

test("should add this keyword to the list of suggestions", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await delay(100);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "th");
  await verifyTypeAheadContainsSuggestions(page, "this", "globalThis");
});

test("should add true/false keywords to the list of suggestions", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await delay(100);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "tr");
  await verifyTypeAheadContainsSuggestions(page, "true");

  await page.fill("[data-test-id=ConsoleTerminalInput]", "fa");
  await verifyTypeAheadContainsSuggestions(page, "false");
});

test("should evaluate terminal expressions without an execution point", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "someUndefinedVariable");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "global-terminal-expression-valid");
});

test("should support terminal expressions with line breaks", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", '"Line 1\\nLine 2"');
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "terminal-expression-with-line-breaks");
});

test("should evaluate and render invalid terminal expressions", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "+/global");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "global-terminal-expression-invalid");
});

test("should show a button to clear terminal expressions", async ({ page }) => {
  await setup(page);

  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await toggleProtocolMessages(page, false);

  // Add some expressions
  await addTerminalExpression(page, "location.href");
  await addTerminalExpression(page, "+/local");

  await expect(await getElementCount(page, "[data-test-name=Message]")).toBe(2);
  await expect(await getElementCount(page, "[data-test-id=ClearConsoleEvaluationsButton]")).toBe(1);

  // Click the button to clear them
  await page.click("[data-test-id=ClearConsoleEvaluationsButton]");

  // Verify an empty terminal
  await expect(await getElementCount(page, "[data-test-name=Message]")).toBe(0);
  await expect(await getElementCount(page, "[data-test-id=ClearConsoleEvaluationsButton]")).toBe(0);
});

test("should escape object expressions in terminal expressions", async ({ page }) => {
  await setup(page);

  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a log");
  await seekToMessage(page, listItem);

  await toggleProtocolMessages(page, false);

  // Add some expressions (local and remote)
  await page.fill("[data-test-id=ConsoleTerminalInput]", '{foo: "bar"}');
  await page.keyboard.press("Enter");
  await page.fill("[data-test-id=ConsoleTerminalInput]", '{"href": location.href}');
  await page.keyboard.press("Enter");

  const list = page.locator("[data-test-name=Messages]");
  await takeScreenshot(page, list, "auto-escaped-terminal-expressions");
});

test("should show the context menu on top of other messages and the current time indicator", async ({
  page,
}) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");

  let listItem = await locateMessage(page, "console-log", "This is a trace");
  await seekToMessage(page, listItem);

  listItem = await locateMessage(page, "console-log", "This is a log");
  await openContextMenu(page, listItem);
  await takeScreenshot(page, list, "context-menu-position-one");

  await page.keyboard.press("Escape");

  listItem = await locateMessage(page, "console-error", "This is an error");
  await openContextMenu(page, listItem);
  await takeScreenshot(page, list, "context-menu-position-two");
});

test("should support setting focus range via the context menu", async ({ page }) => {
  await setup(page, true);

  const list = page.locator("[data-test-name=Messages]");
  let listItem;

  listItem = await locateMessage(page, "console-warning", "This is a warning");
  await openContextMenu(page, listItem);
  await page.click("[data-test-id=ConsoleContextMenu-SetFocusStartButton]");
  await stopHovering(page);
  // Give the UI time to settle.
  await expect(messageLocator(page, "console-log", "This is a log")).toBeHidden();
  await takeScreenshot(page, list, "context-menu-focus-after-start");

  listItem = await locateMessage(page, "console-error", "This is an error");
  await openContextMenu(page, listItem);
  await stopHovering(page);
  await page.click("[data-test-id=ConsoleContextMenu-SetFocusEndButton]");
  // Give the UI time to settle.
  await expect(messageLocator(page, "console-log", "This is a trace")).toBeHidden();
  await takeScreenshot(page, list, "context-menu-focus-after-end");
});
