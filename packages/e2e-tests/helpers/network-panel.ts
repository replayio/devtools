import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { debugPrint } from "./utils";

export async function openNetworkPanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-network"]').click();
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

  let selector = '[data-test-name="NetworkMonitor-RequestRow"]';
  [domain, name, method, status, type].forEach(value => {
    if (value !== undefined) {
      selector += `:has-text("${value}")`;
    }
  });

  const locator = page.locator(selector);

  await expect(await locator.count()).toBe(1);

  return locator;
}
