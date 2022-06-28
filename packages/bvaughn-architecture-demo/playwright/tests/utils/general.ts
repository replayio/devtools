import {
  expect,
  Locator,
  LocatorScreenshotOptions,
  Page,
  PageScreenshotOptions,
} from "@playwright/test";

const SCREENSHOT_OPTIONS: LocatorScreenshotOptions & PageScreenshotOptions = {
  animations: "disabled",
  scale: "css",
};

export function getBaseURL(): string {
  const HOST = process.env.HOST || "localhost";
  return `http://${HOST}:3000`;
}

export async function takeScreenshot(
  page: Page,
  locator: Locator,
  name: string,
  margin: number = 0
): Promise<void> {
  if (!name.endsWith(".png")) {
    name += ".png";
  }

  await page.emulateMedia({ colorScheme: "dark" });
  expect(await takeScreenshotHelper(page, locator, margin)).toMatchSnapshot(["dark", name]);

  await page.emulateMedia({ colorScheme: "light" });
  expect(await takeScreenshotHelper(page, locator, margin)).toMatchSnapshot(["light", name]);
}

async function takeScreenshotHelper(
  page: Page,
  locator: Locator,
  margin: number = 0
): Promise<Buffer> {
  if (margin > 0) {
    const viewport = page.viewportSize()!;
    const bounds = (await locator.boundingBox())!;

    return page.screenshot({
      ...SCREENSHOT_OPTIONS,
      clip: {
        x: Math.max(0, bounds.x - margin),
        y: Math.max(0, bounds.y - margin),
        width: Math.min(bounds.width + margin * 2, viewport.width),
        height: Math.min(bounds.height + margin * 2, viewport.height),
      },
    });
  } else {
    return locator.screenshot(SCREENSHOT_OPTIONS);
  }
}
