import { Page, expect } from "@playwright/test";
import chalk from "chalk";

import { waitForSourceContentsToFinishStreaming } from "./source-panel";
import { debugPrint, getCommandKey, waitFor } from "./utils";

export async function quickOpen(page: Page, url: string): Promise<void> {
  await debugPrint(page, "Opening quick-open dialog", "quickOpen");
  await page.keyboard.press(`${getCommandKey()}+P`);
  await page.focus('[data-test-id="QuickOpenInput"]');

  await debugPrint(page, `Filtering files by "${chalk.bold(url)}"`, "quickOpen");
  await page.keyboard.type(url);

  await debugPrint(page, `Opening file "${chalk.bold(url)}"`, "quickOpen");
  const sourceRow = await page.waitForSelector(
    `[data-test-name="QuickOpenResultsList-Row"]:has-text("${url}")`
  );
  const sourceId = await sourceRow.getAttribute("data-test-id");

  await page.keyboard.press("Enter");

  await waitForSourceContentsToFinishStreaming(page, { sourceId: sourceId! });
}
