import { Locator } from "@playwright/test";
import chalk from "chalk";

import { Screen } from "./types";

// Playwright doesn't provide a good way to do this (yet).
export async function clearTextArea(screen: Screen, textArea: Locator) {
  debugPrint(`Clearing content from textarea`, "clearTextArea");

  await textArea.focus();
  await screen.keyboard.press("Meta+A");
  await screen.keyboard.press("Backspace");
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
