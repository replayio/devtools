import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function getAutocompleteMatches(page: Page) {
  await page.waitForSelector(".autocomplete-matches button");

  return page.evaluate(() => {
    const buttons = [
      ...document.querySelectorAll(".autocomplete-matches button"),
    ] as HTMLButtonElement[];

    return buttons.map(button => button.innerText);
  });
}

export async function checkAutocompleteMatches(page: Page, expected: string[]) {
  await expect
    .poll(async () => {
      const autocompleteMatches = await getAutocompleteMatches(page);
      const actualJSON = JSON.stringify(autocompleteMatches.sort());
      const expectedJSON = JSON.stringify([...expected].sort());

      return actualJSON === expectedJSON;
    })
    .toBeTruthy();
}
