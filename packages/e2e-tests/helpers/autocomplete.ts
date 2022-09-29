import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function getAutocompleteMatches(page: Page) {
  await page.waitForSelector(".autocomplete-matches button", { timeout: 1000 });

  return page.evaluate(() => {
    const buttons = [
      ...document.querySelectorAll(".autocomplete-matches button"),
    ] as HTMLButtonElement[];

    return buttons.map(button => button.innerText);
  });
}

export async function checkAutocompleteMatches(page: Page, expected: string[]) {
  const autocompleteMatches = await getAutocompleteMatches(page);
  const actualJSON = JSON.stringify(autocompleteMatches.sort());
  const expectedJSON = JSON.stringify([...expected].sort());

  expect(actualJSON === expectedJSON).toBeTruthy();
}
