import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { clearTextArea, debugPrint, delay, waitFor } from "./utils";

export async function filterByText(page: Page, text: string): Promise<void> {
  const inputLocator = textFilterLocator(page);
  await inputLocator.focus();
  await clearTextArea(page, inputLocator);
  await page.keyboard.type(text);
}

export function filterTypeCheckboxLocator(page: Page, type: string): Locator {
  return page.locator(`[data-test-id="Network-FilterTypeCheckbox-${type}"]`);
}

export function filterByTypePanelLocator(page: Page): Locator {
  return page.locator('[data-test-id="Network-FilterByTypePanel"]');
}

export async function findNetworkRequestRow(
  page: Page,
  options: {
    domain?: string;
    method?: string;
    name?: string;
    status?: number;
    type?: string;
  }
): Promise<Locator> {
  const { domain, name, method, status, type } = options;

  await debugPrint(page, `Finding network request row`, "findNetworkRequestRow");

  let selector = '[data-test-name="Network-RequestRow"]';
  [domain, name, method, status, type].forEach(value => {
    if (value !== undefined) {
      selector += `:has-text("${value}")`;
    }
  });

  const locator = page.locator(selector);

  await waitFor(async () => expect(await locator.count()).toBe(1));

  return locator;
}

export function networkDetailsPanelLocator(page: Page): Locator {
  return page.locator('[data-test-id="Network-DetailsPanel"]');
}

export function networkListLocator(page: Page): Locator {
  return page.locator('[data-test-id="Network-List"]');
}

export async function openNetworkPanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-network"]').click();
}

export async function selectRequestDetailsTab(page: Page, tabTitle: string): Promise<void> {
  const panelLocator = networkDetailsPanelLocator(page);
  const tabLocator = panelLocator.locator('[data-test-name="Network-DetailsPanel-Tab"]', {
    hasText: tabTitle,
  });

  const state = await tabLocator.getAttribute("data-test-selected");
  const isSelected = state === "true";
  if (!isSelected) {
    await debugPrint(
      page,
      `Selecting network request details tab "${tabTitle}"`,
      "selectRequestDetailsTab"
    );

    await tabLocator.click();
  }

  await waitFor(
    async () => {
      const state = await tabLocator.getAttribute("data-test-selected");
      const isSelected = state === "true";
      expect(isSelected).toBe(true);
    },
    { retryInterval: 500, timeout: 15_000 }
  );
}

export async function seekToRequestRow(
  page: Page,
  options: {
    domain?: string;
    method?: string;
    name?: string;
    status?: number;
    type?: string;
  }
): Promise<void> {
  await selectRequestRow(page, options);

  await debugPrint(page, "Seeking to network request", "seekToRequestRow");

  const rowLocator = await findNetworkRequestRow(page, options);
  const seekButton = rowLocator.locator('[data-test-name="Network-RequestRow-SeekButton"]');
  await seekButton.click();
}

export async function selectRequestRow(
  page: Page,
  options: {
    domain?: string;
    method?: string;
    name?: string;
    status?: number;
    type?: string;
  }
): Promise<void> {
  const rowLocator = await findNetworkRequestRow(page, options);
  const state = await rowLocator.getAttribute("data-test-state");
  const isSelected = state === "enabled";
  if (!isSelected) {
    await debugPrint(page, "Selecting network request row", "selectRequestRow");

    await rowLocator.click();
  }
}

export async function verifyNetworkRequestsCount(page: Page, expectedCount: number): Promise<void> {
  const listLocator = networkListLocator(page);
  await waitFor(async () => {
    await expect(await listLocator.getAttribute("data-visible-items-count")).toBe(
      "" + expectedCount
    );
  });
}

export function textFilterLocator(page: Page): Locator {
  return page.locator('[data-test-id="Network-TextFilterInput"]');
}

export async function toggleFilterByType(
  page: Page,
  type: string,
  enabled: boolean
): Promise<void> {
  const checkboxLocator = filterTypeCheckboxLocator(page, type);
  const state = await checkboxLocator.getAttribute("data-test-state");
  const isEnabled = state === "enabled";
  if (isEnabled !== enabled) {
    await debugPrint(
      page,
      `${chalk.bold(enabled ? "Filtering by" : "Clearing filter for")} "${type}" requests`,
      "toggleFilterByType"
    );

    await checkboxLocator.click();
  }
}

export async function toggleFilterByTypePanel(page: Page, open: boolean): Promise<void> {
  const buttonLocator = page.locator('[data-test-id="Network-ToggleFilterByTypePanelButton"]');
  const state = await buttonLocator.getAttribute("data-test-state");
  const isOpen = state === "open";
  if (isOpen !== open) {
    await debugPrint(
      page,
      `${chalk.bold(open ? "Opening" : "Closing")} the filter-by-type panel`,
      "toggleFilterByTypePanel"
    );

    await buttonLocator.click();
  }
}

export async function verifyNetworkDetailsPanelContains(
  page: Page,
  expectedText: string
): Promise<void> {
  await waitFor(async () => {
    try {
      const detailsPanelLocator = networkDetailsPanelLocator(page);
      await expect(await detailsPanelLocator.textContent()).toContain(expectedText);
    } catch (error) {
      // Wait in case the data is still loading
      await delay(1_000);

      throw error;
    }
  });
}

export async function verifyNetworkDetailsTabsVisible(
  page: Page,
  expectedTexts: string[]
): Promise<void> {
  await waitFor(async () => {
    const detailsPanelLocator = networkDetailsPanelLocator(page);
    const tabsLocator = detailsPanelLocator.locator('[data-test-name="Network-DetailsPanel-Tab"]');
    await expect(await tabsLocator.count()).toBe(expectedTexts.length);

    for (let index = 0; index < expectedTexts.length; index++) {
      const tabLocator = tabsLocator.nth(index);
      const expectedText = expectedTexts[index];
      await expect(await tabLocator.textContent()).toContain(expectedText);
    }
  });
}

export async function verifyRequestRowTimelineState(
  page: Page,
  options: {
    domain?: string;
    method?: string;
    name?: string;
    status?: number;
    type?: string;
  },
  expectedState: "after" | "before" | "first-after"
): Promise<void> {
  const rowLocator = await findNetworkRequestRow(page, options);

  await debugPrint(
    page,
    `Verifying request row timeline state is ${chalk.bold(`"${expectedState}"`)}`,
    "verifyRequestRowTimelineState"
  );

  await expect(await rowLocator.getAttribute("data-current-time")).toBe(
    expectedState === "before" ? null : expectedState
  );
}
