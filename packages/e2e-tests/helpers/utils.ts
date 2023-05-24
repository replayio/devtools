import { Locator, Page } from "@playwright/test";
import chalk from "chalk";

export function getCommandKey() {
  const macOS = process.platform === "darwin";
  return macOS ? "Meta" : "Control";
}

// Playwright doesn't provide a good way to do this (yet).
export async function clearTextArea(page: Page, textArea: Locator) {
  await debugPrint(page, `Clearing content from textarea`, "clearTextArea");

  const selectAllCommand = `${getCommandKey()}+A`;

  await textArea.focus();
  await page.keyboard.press(selectAllCommand);
  await page.keyboard.press("Backspace");
}

// Other test utils can use this to print formatted status messages that help visually monitor test progress.
export async function debugPrint(page: Page | null, message: string, scope?: string) {
  console.log("      ", message, scope ? chalk.dim(`(${scope})`) : "");

  if (page !== null) {
    await page.evaluate(
      ({ message, scope }) => {
        console.log(`${message} %c${scope || ""}`, "color: #999;");
      },
      { message, scope }
    );
  }
}

// This helper can be useful when debugging tests but should not be used in committed tests.
// (In other words, don't commit code that relies on this in order to work.)
export function delay(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export async function find(
  locatorList: Locator,
  callback: (singleLocator: Locator, index: number) => Promise<boolean>
): Promise<Locator | null> {
  const count = await locatorList.count();
  for (let index = 0; index < count; index++) {
    const singleLocator = locatorList.nth(index);
    const match = await callback(singleLocator, index);
    if (match) {
      return singleLocator;
    }
  }

  return null;
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

export async function mapLocators<T>(
  locatorList: Locator,
  callback: (singleLocator: Locator, index: number) => Promise<T>
) {
  const count = await locatorList.count();
  return Promise.all(
    Array.from({ length: count }).map((_, i) => {
      return callback(locatorList.nth(i), i);
    })
  );
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
    await debugPrint(
      page,
      `${targetState === "open" ? "Opening" : "Closing"} ${label}`,
      "toggleExpandable"
    );

    await expander.click();
  } else {
    await debugPrint(page, `The ${label} is already ${targetState}`, "toggleExpandable");
  }
}

export async function waitFor(
  callback: () => Promise<void>,
  options: {
    retryInterval?: number;
    timeout?: number;
  } = {}
): Promise<void> {
  const { retryInterval = 250, timeout = 5_000 } = options;

  const startTime = performance.now();

  while (true) {
    try {
      await callback();

      return;
    } catch (error) {
      if (typeof error === "string") {
        console.log(error);
      }

      if (performance.now() - startTime > timeout) {
        throw error;
      }

      await delay(retryInterval);

      continue;
    }
  }
}

export const getElementClasses = (loc: Locator) => loc.evaluate(el => Array.from(el.classList));
