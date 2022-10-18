import { expect, Locator, Page } from "@playwright/test";
import { clearTextArea, delay, getCommandKey } from "./general";

export async function addLogPoint(page: Page, sourceId: string, lineNumber: number) {
  await openSourceFile(page, sourceId);
  await goToLine(page, lineNumber);

  const locator = getSourceLineLocator(page, sourceId, lineNumber);

  // Hover over the line number itself, not the line, to avoid triggering protocol preview requests.
  await locator
    .locator(`[data-test-id="SourceLine-LineNumber-${lineNumber}"]`)
    .hover({ force: true });

  const button = locator.locator('[data-test-name="AddPointButton"]');
  await button.click({ force: true });
}

export async function focusOnSource(page: Page) {
  const sourcesRoot = page.locator('[data-test-id="SourcesRoot"]');
  await expect(sourcesRoot).toBeVisible();
  await sourcesRoot.focus();
  await expect(sourcesRoot).toBeFocused();
}

export function getSourceFileNameSearchResultsLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SourceFileNameSearchResults"]`);
}

export function getSourceLocator(page: Page, sourceId: string): Locator {
  return page.locator(`[data-test-id="Source-${sourceId}"]`);
}

export function getSourceLineLocator(page: Page, sourceId: string, lineNumber: number): Locator {
  const sourceLocator = getSourceLocator(page, sourceId);
  return sourceLocator.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
}

export function getSearchSourceLocator(page: Page): Locator {
  return page.locator(`[data-test-id="SourceSearch"]`);
}

export async function goToLine(page: Page, lineNumber: number) {
  await focusOnSource(page);

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("o");
  await page.keyboard.up(getCommandKey());

  const input = page.locator('[data-test-id="SourceFileNameSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(`:${lineNumber}`);
  await page.keyboard.press("Enter");

  const lineLocator = page.locator(`[data-test-id="SourceLine-${lineNumber}"]`);
  await expect(lineLocator).toBeVisible();

  // Give the list time to render and settle.
  await delay(1000);
}

export async function openSourceFile(page: Page, sourceId: string) {
  await page.locator(`[data-test-id="SourceExplorerSource-${sourceId}"]`).click();
}

export async function searchSourceText(page: Page, text: string) {
  await focusOnSource(page);

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("f");
  await page.keyboard.up(getCommandKey());

  const input = page.locator('[data-test-id="SourceSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(text);
}

export async function searchSourcesByName(page: Page, text: string) {
  await focusOnSource(page);

  await page.keyboard.down(getCommandKey());
  await page.keyboard.type("o");
  await page.keyboard.up(getCommandKey());

  const input = page.locator('[data-test-id="SourceFileNameSearchInput"]');
  await expect(input).toBeFocused();

  await clearTextArea(page, input);
  await page.keyboard.type(text);
}
