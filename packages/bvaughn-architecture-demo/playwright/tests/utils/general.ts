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

export async function getElementCount(page: Page, queryString: string): Promise<number> {
  const count = await page.evaluate(
    queryString => document.querySelectorAll(queryString).length,
    queryString
  );
  return count;
}

export function getURLFlags(): string {
  const RECORD_PROTOCOL_DATA = !!process.env.RECORD_PROTOCOL_DATA;
  return RECORD_PROTOCOL_DATA ? "record" : "";
}

export async function takeScreenshot(
  page: Page,
  locator: Locator,
  name: string,
  margin: number = 0
): Promise<void> {
  if (process.env.RECORD_PROTOCOL_DATA) {
    // We aren't visually debugging; we're just recording snapshot data.
    // Skip this method to make the tests run faster.
    return;
  }

  if (process.env.VISUAL_DEBUG) {
    await new Promise(resolve => resolve(250));
    return;
  }

  if (!name.endsWith(".png")) {
    name += ".png";
  }

  await page.emulateMedia({ colorScheme: "dark" });
  const screenshotDark = await takeScreenshotHelper(page, locator, margin);
  expect(screenshotDark).toMatchSnapshot(["dark", name]);

  await page.emulateMedia({ colorScheme: "light" });
  const screenshotLight = await takeScreenshotHelper(page, locator, margin);
  expect(screenshotLight).toMatchSnapshot(["light", name]);
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
