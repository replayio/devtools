import { Page } from "@playwright/test";
import chalk from "chalk";

import { debugPrint } from "./utils";

export async function quickOpen(page: Page, url: string): Promise<void> {
  debugPrint("Opening quick-open dialog", "quickOpen");
  await page.keyboard.press("Meta+P");
  await page.focus('[data-test-id="QuickOpenInput"]');

  debugPrint(`Filtering files by "${chalk.bold(url)}"`, "quickOpen");
  await page.keyboard.type(url);
  await page.waitForSelector(`[data-test-id="QuickOpenResultsList"]:has-text("${url}")`);

  debugPrint(`Opening file "${chalk.bold(url)}"`, "quickOpen");
  await page.keyboard.press("Enter");
  await page.waitForSelector(`[data-test-name="Source-${url}"]`);
}
