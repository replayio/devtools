import fs from "fs";
import path from "path";
import {
  Locator,
  LocatorScreenshotOptions,
  Page,
  PageScreenshotOptions,
  expect,
} from "@playwright/test";
import chalk from "chalk";

import { getCurrentTestInfo } from "replay-next/playwright/tests/currentTestInfoWatcher";

const { HOST, VISUAL_DEBUG, WRITE_SNAPSHOT_IMAGE_FILES } = process.env;

const SCREENSHOT_OPTIONS: LocatorScreenshotOptions & PageScreenshotOptions = {
  animations: "disabled",
  scale: "css",
};

export async function awaitNoLoaders(page: Page, scope: Locator | null = null) {
  let attempts = 0;

  while (attempts < 10) {
    const locator = scope
      ? scope.locator("[data-test-name=Loader]")
      : page.locator("[data-test-name=Loader]");
    const count = await locator.count();
    if (count === 0) {
      return;
    }

    attempts++;

    await delay(100);
  }

  throw Error("Timed out waiting for loaders to finish");
}

// Other test utils can use this to print formatted status messages that help visually monitor test progress.
export async function debugPrint(page: Page | null, message: string, scope?: string) {
  console.log("        ", chalk.green(message), scope ? chalk.dim(` (${scope})`) : "");
  if (page !== null) {
    await page.evaluate(
      ({ message, scope }) => {
        console.log(`${message} %c${scope || ""}`, "color: #999;");
      },
      { message, scope }
    );
  }
}

export async function delay(duration: number = 250) {
  await new Promise(resolve => setTimeout(resolve, duration));
}

export function getCommandKey() {
  const macOS = process.platform === "darwin";
  return macOS ? "Meta" : "Control";
}

// Playwright doesn't provide a good way to do this (yet).
export async function clearTextArea(page: Page, textArea: Locator) {
  const selectAllCommand = `${getCommandKey()}+A`;

  await textArea.focus();
  await page.keyboard.press(selectAllCommand);
  await page.keyboard.press("Backspace");
}

export async function getElementCount(page: Page, queryString: string): Promise<number> {
  const count = await page.evaluate(
    queryString => document.querySelectorAll(queryString).length,
    queryString
  );
  return count;
}

export function getTestUrl(testRoute: string, additionalQueryParams: string[] = []): string {
  const { debug, record, recordingId } = global as any;

  const host = HOST || "localhost";

  const queryParams: string[] = [`host=${host}`];
  if (debug) {
    queryParams.push("debug");
  }
  if (record) {
    queryParams.push("record");
  }
  if (recordingId) {
    queryParams.push(`recordingId=${recordingId}`);
  }

  queryParams.push(...additionalQueryParams);

  const url = `http://${host}:3000/tests/${testRoute}?${queryParams.join("&")}`;

  console.log(`         Opening ${chalk.underline.blue.bold(url)}`);

  return url;
}

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function getVisibleRectForLocator(locator: Locator): Promise<Rect> {
  const rect = await locator.evaluate((element: HTMLElement) => {
    let elementRect = element.getBoundingClientRect();

    let visibleRect = {
      left: elementRect.left,
      right: elementRect.right,
      top: elementRect.top,
      bottom: elementRect.bottom,
    };

    let currentElement: HTMLElement | null = element;
    while (currentElement !== null) {
      const overflow = window.getComputedStyle(currentElement).getPropertyValue("overflow");
      if (overflow === "visible") {
        currentElement = currentElement.parentElement;
        continue;
      }

      const rect = currentElement.getBoundingClientRect();

      visibleRect.left = Math.max(visibleRect.left, rect.left);
      visibleRect.right = Math.min(visibleRect.right, rect.right);
      visibleRect.top = Math.max(visibleRect.top, rect.top);
      visibleRect.bottom = Math.min(visibleRect.bottom, rect.bottom);

      currentElement = currentElement.parentElement;
    }

    return visibleRect;
  });

  return {
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  };
}

export async function stopHovering(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
}

export async function takeScreenshot(page: Page, locator: Locator, name: string): Promise<void> {
  // Make sure any suspended components finish loading data before taking the screenshot.
  await awaitNoLoaders(page, locator);
  // dark screenshots (which are taken first) seemed to be flakier than the light ones,
  // adding a little delay here seems to help
  await delay(1);

  if (VISUAL_DEBUG) {
    await delay(250);
    return;
  }

  if (!name.endsWith(".png")) {
    name += ".png";
  }

  await page.emulateMedia({ colorScheme: "dark" });
  const screenshotDark = await takeScreenshotHelper(page, locator);

  let baseDir = path.join(__dirname, `../../visuals/`);
  if (WRITE_SNAPSHOT_IMAGE_FILES) {
    const testInfo = getCurrentTestInfo();
    if (testInfo) {
      // from e.g. "tests/console/should-display-list-of-messages.ts/..."
      // to e.g. "console/should-display-list-of-messages/..."
      const titlePath = testInfo.titlePath[0];
      const parsed = path.parse(titlePath);

      baseDir = path.join(
        __dirname,
        "..",
        "..",
        "visuals",
        // Remove "tests" base directory
        parsed.dir.split(path.delimiter).slice(1).join(path.delimiter),
        // Exclude file extension from top directory name
        parsed.name
      );
    }
  }

  if (WRITE_SNAPSHOT_IMAGE_FILES) {
    const darkDir = path.join(baseDir, "dark");
    fs.mkdirSync(darkDir, { recursive: true });
    fs.writeFileSync(path.join(darkDir, name), screenshotDark);
    expect(screenshotDark).not.toBeNull();
  } else {
    expect(screenshotDark).toMatchSnapshot(["dark", name]);
  }

  await page.emulateMedia({ colorScheme: "light" });
  const screenshotLight = await takeScreenshotHelper(page, locator);
  if (WRITE_SNAPSHOT_IMAGE_FILES) {
    const lightDir = path.join(baseDir, "light");
    fs.mkdirSync(lightDir, { recursive: true });
    fs.writeFileSync(path.join(lightDir, name), screenshotLight);
    expect(screenshotLight).not.toBeNull();
  } else {
    expect(screenshotLight).toMatchSnapshot(["light", name]);
  }
}

async function takeScreenshotHelper(page: Page, locator: Locator): Promise<Buffer> {
  const rect = await getVisibleRectForLocator(locator);

  return page.screenshot({
    ...SCREENSHOT_OPTIONS,
    clip: rect,
  });
}

export async function typeCommandKey(page: Page, key: string) {
  await page.keyboard.down(getCommandKey());
  await page.keyboard.type(key);
  await page.keyboard.up(getCommandKey());
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
