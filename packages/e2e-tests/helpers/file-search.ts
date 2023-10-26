import { Locator, Page, expect } from "@playwright/test";

import { clearTextArea, waitFor } from "./utils";

export function getFileSearchPanel(page: Page): Locator {
  return page.locator('[data-test-id="FileSearch-Panel"]');
}

export async function openFileSearchPanel(page: Page): Promise<void> {
  // Only click if it's not already open; clicking again will collapse the side bar.
  const pane = getFileSearchPanel(page);

  let isVisible = await pane.isVisible();
  if (!isVisible) {
    await page.locator('[data-test-name="ToolbarButton-Search"]').click();
  }
}

export async function searchSources(page: Page, text: string) {
  const input = page.locator('[data-test-id="FileSearch-Input"]');
  await input.focus();

  await clearTextArea(page, input);

  await input.fill(text);
  await page.keyboard.press("Enter");
}

export async function toggleExcludeNodeModulesCheckbox(page: Page, checked: boolean) {
  const toggleButton = page.locator('[data-test-id="FileSearch-ExcludeNodeModules"]');
  const currentChecked = (await toggleButton.getAttribute("data-active"))! === "true";

  if (checked !== currentChecked) {
    await toggleButton.click();
  }
}

export async function toggleSearchResultsForFileName(
  page: Page,
  isOpen: boolean,
  options: {
    fileName?: string;
    rowIndex?: number;
    sourceId?: string;
  }
) {
  const { fileName, rowIndex, sourceId } = options;

  let locationRows: Locator = page.locator(`[data-test-name="SearchFiles-ResultRow"]`);
  if (sourceId != null) {
    locationRows = page.locator(`[data-test-id="SearchFiles-ResultRow-${sourceId}"]`);
  } else if (fileName != null) {
    locationRows = page.locator(`[data-test-filename="${fileName}"]`);
  } else if (rowIndex != null) {
    locationRows = locationRows.nth(rowIndex);
  } else {
    throw `No options provided`;
  }

  const count = await locationRows.count();
  if (count === 0) {
    throw `Did not find any locations matching file name "${fileName}"`;
  }

  for (let i = 0; i < count; i++) {
    const locationRow = locationRows.nth(i);
    const expandable = locationRow.locator('[data-test-name="Expandable"]');
    const state = await expandable.getAttribute("data-test-state");
    const currentIsOpen = state === "open";
    if (isOpen !== currentIsOpen) {
      await locationRow.click();
      await expect(await expandable.getAttribute("data-test-state")).toBe(
        isOpen ? "open" : "closed"
      );
    }
  }
}

export async function verifyMatchExecuted(
  page: Page,
  lineNumber: number,
  expectedExecuted: boolean
) {
  await waitForSearchToFinish(page);

  const line = page.locator('[data-test-name="SearchFiles-ResultRow"]').nth(lineNumber - 1);

  await waitFor(async () => {
    const hitCountString = await line.getAttribute("data-hit-count");
    const actualExecuted = !!hitCountString && hitCountString !== "0";
    if (actualExecuted !== expectedExecuted) {
      throw `Expected result ${lineNumber} to ${
        expectedExecuted ? "be executed" : "not be executed"
      } but was wrong`;
    }
  });
}

export async function verifySourceSearchSummary(page: Page, expectedSummary: string) {
  await waitForSearchToFinish(page);

  const summary = page.locator('[data-test-id="SearchFiles-SummaryLabel"]');

  await waitFor(async () => {
    const actualSummary = await summary.textContent();
    if (actualSummary !== expectedSummary) {
      throw `Expected search summary "${expectedSummary}" but found "${actualSummary}"`;
    }
  });
}

export async function verifySourceSearchOverflowMessageShown(page: Page, expectedShown: boolean) {
  await waitForSearchToFinish(page);

  const overflowMessage = page.locator('[data-test-id="SourceSearch-OverflowMessage"]');
  if (expectedShown) {
    await expect(overflowMessage).toBeVisible();
  } else {
    await expect(overflowMessage).not.toBeVisible();
  }
}

export async function verifyVisibleResultsCount(page: Page, expectedCount: number) {
  await waitForSearchToFinish(page);

  const rows = page.locator('[data-test-name="SearchFiles-ResultRow"]');

  await waitFor(async () => {
    const actualCount = await rows.count();
    if (actualCount !== expectedCount) {
      throw `Expected ${expectedCount} visible results but found ${actualCount}`;
    }
  });
}

export async function waitForSearchToFinish(page: Page) {
  const summary = page.locator('[data-test-id="SearchFiles-SummaryLabel"]');
  await waitFor(async () => {
    const state = await summary.getAttribute("data-test-state");
    if (state === "pending") {
      throw `Waiting for search to finish`;
    }
  });
}
