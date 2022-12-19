import { Page } from "@playwright/test";
import chalk from "chalk";

import { debugPrint, getCommandKey } from "./utils";

export async function quickOpen(page: Page, url: string): Promise<void> {
  await debugPrint(page, "Opening quick-open dialog", "quickOpen");
  await page.keyboard.press(`${getCommandKey()}+P`);
  await page.focus('[data-test-id="QuickOpenInput"]');

  await debugPrint(page, `Filtering files by "${chalk.bold(url)}"`, "quickOpen");
  await page.keyboard.type(url);
  await page.waitForSelector(`[data-test-id="QuickOpenResultsList"]:has-text("${url}")`);

  await debugPrint(page, `Opening file "${chalk.bold(url)}"`, "quickOpen");
  await page.keyboard.press("Enter");
  await page.waitForSelector(`[data-test-name="Source-${url}"]`);
  await page.waitForSelector(`[data-test-name="Source"]`);
}
