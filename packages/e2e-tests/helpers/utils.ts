import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

// Playwright doesn't provide a good way to do this (yet).
export async function clearTextArea(page: Page, textArea: Locator) {
  debugPrint(`Clearing content from textarea`, "clearTextArea");

  await textArea.focus();
  await page.keyboard.press("Meta+A");
  await page.keyboard.press("Backspace");
}

// Other test utils can use this to print formatted status messages that help visually monitor test progress.
export function debugPrint(message: string, scope?: string) {
  console.log(message, scope ? chalk.dim(`(${scope})`) : "");
}

// This helper can be useful when debugging tests but should not be used in committed tests.
// (In other words, don't commit code that relies on this in order to work.)
export function delay(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}
