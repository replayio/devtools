import { Page } from "@playwright/test";

import { delay, getCommandKey } from "./utils";

export async function clearText(page: Page, selector: string) {
  await focus(page, selector);

  const input = page.locator(selector);

  // Timing awkwardness;
  // Make sure we clear all of the text (and not just most of it)
  while (((await input.textContent()) || "").trim() !== "") {
    await delay(100);

    await page.keyboard.press(`${getCommandKey()}+A`);
    await page.keyboard.press("Backspace");
  }
}

export async function focus(page: Page, selector: string) {
  // For some reason, locator.focus() does not work as expected;
  // Lexical's own Playwright tests use page.focus(selector) though and it works.
  await page.focus(selector);
}

export async function hideTypeAheadSuggestions(page: Page, selector: string) {
  const list = page.locator('[data-test-name$="CodeTypeAhead"]');

  if (await list.isVisible()) {
    const input = page.locator(selector);
    await input.press("Escape");
  }
}

export async function isEditable(page: Page, selector: string): Promise<boolean> {
  const input = page.locator(selector);
  const editable = await input.getAttribute("contenteditable");
  return editable === "true";
}

export async function submitCurrentText(page: Page, selector: string) {
  const input = page.locator(selector);
  const initialText = await input.textContent();

  await hideTypeAheadSuggestions(page, selector);

  let loopCounter = 0;

  // Timing awkwardness;
  // Sometimes the typeahead misses an "Enter" command and doesn't submit the form.
  while ((await input.textContent()) === initialText) {
    await delay(100);

    await input.press("Enter");

    if (loopCounter++ > 5) {
      // Give up after a few tries;
      // This likely indicates something unexpected.
      break;
    }
  }
}

export async function type(page: Page, selector: string, text: string, shouldSubmit: boolean) {
  await clearText(page, selector);

  const input = page.locator(selector);
  await input.type(text);

  if (shouldSubmit) {
    await delay(200);
    await submitCurrentText(page, selector);
  }
}
