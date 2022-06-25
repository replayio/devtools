import { expect, Locator, Page } from "@playwright/test";

export async function takeScreenshot(page: Page, locator: Locator, name: string) {
  if (!name.endsWith(".png")) {
    name += ".png";
  }

  await page.emulateMedia({ colorScheme: "dark" });
  expect(await locator.screenshot()).toMatchSnapshot(["dark", name]);

  await page.emulateMedia({ colorScheme: "light" });
  expect(await locator.screenshot()).toMatchSnapshot(["light", name]);
}
