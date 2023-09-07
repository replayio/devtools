import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { openContextMenu } from "./console-panel";
import { selectContextMenuItem } from "./context-menu";
import { debugPrint, waitFor } from "./utils";

export async function filterTestRecordingList(page: Page, options: { text: string }) {
  const { text } = options;

  await debugPrint(
    page,
    `Filtering test recordings list by text ${chalk.bold(`"${text}"`)}`,
    "filterTestRunsList"
  );

  const input = page.locator('[data-test-id="TestRunResults-FilterInput"]');
  await input.fill(text);

  const results = page.locator('[data-test-id="TestRunResults"]');

  // Wait for new settings to be applied
  await waitFor(async () => {
    const currentText = await results.getAttribute("data-filtered-by-text");
    expect(currentText).toBe(text);
  });
}

export async function filterTestRunsList(
  page: Page,
  options: { branch?: "all" | "primary"; status?: "all" | "failed"; text?: string } = {}
) {
  const { branch = "all", status = "all", text = "" } = options;

  await debugPrint(
    page,
    `Filtering test runs list by status ${chalk.bold(status)} and text ${chalk.bold(`"${text}"`)}`,
    "filterTestRunsList"
  );

  const filterByBranchDropDownMenu = page.locator(
    '[data-test-id="TestRunsPage-BranchFilter-DropdownTrigger"]'
  );
  await openContextMenu(filterByBranchDropDownMenu, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: branch == "primary" ? "show-only-primary-branch" : "show-all-branches",
  });

  const filterByStatusDropDownMenu = page.locator(
    '[data-test-id="TestRunsPage-ResultFilter-DropdownTrigger"]'
  );
  await openContextMenu(filterByStatusDropDownMenu, { useLeftClick: true });
  await selectContextMenuItem(page, {
    contextMenuItemTestId: status == "failed" ? "show-only-failures" : "show-all-runs",
  });

  const filterByTextInput = page.locator('[data-test-id="TestRunsPage-FilterByText-Input"]');
  await filterByTextInput.fill(text);

  const list = page.locator('[data-test-id="TestRunList"]');

  // Wait for new settings to be applied
  await waitFor(async () => {
    const currentStatus = await list.getAttribute("data-filtered-by-status");
    const currentText = await list.getAttribute("data-filtered-by-text");
    expect(currentStatus).toBe(status);
    expect(currentText).toBe(text);
  });
}

export function findTestRecordingsInTree(
  scope: Locator | Page,
  options: { status?: "failed" | "flaky" | "passed"; title?: string } = {}
): Locator {
  const { status, title } = options;
  if (status && title) {
    throw new Error("Cannot search by both status and title");
  }

  if (status) {
    return scope.locator(`[data-test-id="TestRunResultsListItem"][data-test-status="${status}"]`);
  } else if (title) {
    return scope.locator('[data-test-id="TestRunResultsListItem"]', {
      hasText: title,
    });
  } else {
    return scope.locator('[data-test-id="TestRunResultsListItem"]');
  }
}

export function findTestRecordingsTreeFileNodes(
  scope: Locator | Page,
  options: { text?: string } = {}
) {
  const { text } = options;
  if (text) {
    return scope.locator('[data-test-id="TestRunResult-FileNode"]', {
      hasText: text,
    });
  } else {
    return scope.locator('[data-test-id="TestRunResult-FileNode"]');
  }
}

export function findTestRecordingsTreePathNodes(
  scope: Locator | Page,
  options: { text?: string } = {}
) {
  const { text } = options;
  if (text) {
    return scope.locator('[data-test-id="TestRunResult-PathNode"]', {
      hasText: text,
    });
  } else {
    return scope.locator('[data-test-id="TestRunResult-PathNode"]');
  }
}

export function findTestRunsInList(
  page: Page,
  options: { status?: "fail" | "success"; title?: string } = {}
): Locator {
  const { status, title } = options;
  if (status && title) {
    throw new Error("Cannot search by both status and title");
  }

  if (status) {
    return page.locator('[data-test-id="TestRunListItem"]', {
      has: page.locator(`[data-test-status="${status}"]`),
    });
  } else if (title) {
    return page.locator('[data-test-id="TestRunListItem"]', {
      has: page.locator(`[data-test-id="TestRun-Title"]`, {
        hasText: title,
      }),
    });
  } else {
    return page.locator('[data-test-id="TestRunListItem"]');
  }
}

export async function findTestResultsStatusCount(
  page: Page,
  status: "flaky" | "failed" | "passed"
) {
  const groupLocator = findTestResultsStatusGroup(page, status);
  const count = await groupLocator
    .locator(`[data-test-id="TestRunResults-StatusGroup-Count"]`)
    .textContent();

  return count !== null ? parseInt(count, 10) : 0;
}

export function findTestResultsStatusGroup(page: Page, status: "flaky" | "failed" | "passed") {
  return page.locator(`[data-test-id="TestRunResults-StatusGroup-${status}"]`);
}

export function getTestRunAttribute(
  testRunLocator: Locator,
  type: "Branch" | "Date" | "Duration" | "PullRequest" | "Username"
) {
  return testRunLocator.locator(`[data-test-id="TestRun-${type}"]`);
}

export function getTestRunSummary(page: Page) {
  return page.locator('[data-test-id="TestRunSummary"]');
}

export async function getVisibleBranchNames(page: Page): Promise<string[]> {
  const locator = page.locator('[data-test-id="TestRun-Branch"]');
  const count = await locator.count();
  const branchNames = new Set<string>();
  for (let index = 0; index < count; index++) {
    const branchName = await locator.nth(index).textContent();
    branchNames.add(branchName ?? "");
  }
  return Array.from(branchNames);
}
