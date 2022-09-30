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

export async function forEach(
  locatorList: Locator,
  callback: (singleLocator: Locator, index: number) => Promise<void>
): Promise<void> {
  const count = await locatorList.count();
  for (let index = 0; index < count; index++) {
    const singleLocator = locatorList.nth(index);
    await callback(singleLocator, index);
  }
}

export async function toggleExpandable(
  page: Page,
  options: {
    scope?: Locator;
    targetState?: "open" | "closed";
    text?: string;
  }
): Promise<void> {
  const { scope = page, targetState = "open", text } = options;

  const label = text ? `expandable with text "${chalk.bold(text)}"` : "expandable";

  const expander = text
    ? scope.locator(`[data-test-name="Expandable"]:has-text("${text}")`).first()
    : scope.locator(`[data-test-name="Expandable"]`).first();
  const currentState = await expander.getAttribute("data-test-state");
  if (currentState !== targetState) {
    debugPrint(`${targetState === "open" ? "Opening" : "Closing"} ${label}`, "toggleExpandable");

    await expander.click();
  } else {
    debugPrint(`The ${label} is already ${targetState}`, "toggleExpandable");
  }
}
