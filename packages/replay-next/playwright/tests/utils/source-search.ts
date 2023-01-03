import { Locator, Page, expect } from "@playwright/test";

import { clearTextArea, stopHovering, waitFor } from "./general";

export function getSourceSearchResultsLocator(page: Page): Locator {
  return page.locator('[data-test-id="SourceSearch-Results"]');
}

export async function clickSearchResultRow(page: Page, rowNumber: number) {
  const rows = page.locator('[data-test-name="SearchFiles-ResultRow"]');
  const row = rows.nth(rowNumber - 1);
  const type = await row.getAttribute("data-test-type");
  if (type !== "Match") {
    throw `Row ${rowNumber} does not contain a match`;
  }

  await row.click();

  // Clean up hover state in case of screenshot testing
  await stopHovering(page);
}

export async function searchSources(page: Page, text: string) {
  const input = page.locator('[data-test-id="SearchFiles-Input"]');
  await input.focus();

  await clearTextArea(page, input);

  await input.fill(text);
  await page.keyboard.press("Enter");
}

export async function toggleIncludeNodeModulesCheckbox(page: Page, checked: boolean) {
  const checkbox = page.locator('[data-test-id="SearchFiles-IncludeNodeModules-Checkbox"]');
  const currentChecked = await checkbox.isChecked();
  if (checked !== currentChecked) {
    await checkbox.click();
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

  // Clean up hover state in case of screenshot testing
  await stopHovering(page);
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

export async function verifySourceSearchMatchingLocations(page: Page, expectSourceIds: string[]) {
  await waitForSearchToFinish(page);

  const locationRows = page.locator(
    '[data-test-name="SearchFiles-ResultRow"][data-test-type="Location"]'
  );

  await waitFor(async () => {
    const count = await locationRows.count();
    if (count !== expectSourceIds.length) {
      throw `Expected ${expectSourceIds.length} file names but found ${count}`;
    }

    for (let i = 0; i < count; i++) {
      const locationRow = locationRows.nth(i);
      const testId = await locationRow.getAttribute("data-test-id");
      const sourceId = testId!.split("-").pop();
      const index = expectSourceIds.indexOf(sourceId!);
      if (index < 0) {
        throw `No match for source "${sourceId}"`;
      }

      expectSourceIds.splice(index, 1);
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
