import { expect, Locator, LocatorScreenshotOptions, Page } from "@playwright/test";

const SCREENSHOT_OPTIONS: LocatorScreenshotOptions = { scale: "css", animations: "disabled" };

export async function takeScreenshot(page: Page, locator: Locator, name: string) {
  if (!name.endsWith(".png")) {
    name += ".png";
  }

  await page.emulateMedia({ colorScheme: "dark" });
  expect(await locator.screenshot(SCREENSHOT_OPTIONS)).toMatchSnapshot(["dark", name]);

  await page.emulateMedia({ colorScheme: "light" });
  expect(await locator.screenshot(SCREENSHOT_OPTIONS)).toMatchSnapshot(["light", name]);
}
