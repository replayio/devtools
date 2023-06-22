import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import {
  Locator,
  LocatorScreenshotOptions,
  Page,
  PageScreenshotOptions,
  TestInfo,
  expect,
} from "@playwright/test";
import chalk from "chalk";

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

export async function takeScreenshot(
  page: Page,
  testInfo: TestInfo,
  locator: Locator,
  name: string
): Promise<void> {
  // Make sure any suspended components finish loading data before taking the screenshot.
  await awaitNoLoaders(page, locator);
  // dark screenshots (which are taken first) seemed to be flakier than the light ones,
  // adding a little delay here seems to help
  await delay(1);

  if (VISUAL_DEBUG) {
    await delay(250);
    return;
  }

  const imageFilenameWithoutExtension = name.endsWith(".png") ? name.slice(0, -4) : name;
  const imageFilename = `${imageFilenameWithoutExtension}.png`;

  let baseDir = path.join(__dirname, `../../visuals/`);
  if (WRITE_SNAPSHOT_IMAGE_FILES) {
    // Ensure tests that have screenshots with the same name don't interfere with each other.
    const sha = createHash("sha256").update(testInfo.titlePath[0]).digest("hex");

    baseDir = path.join(__dirname, "..", "..", "visuals", sha, imageFilenameWithoutExtension);

    fs.mkdirSync(baseDir, { recursive: true });
    fs.writeFileSync(
      path.join(baseDir, `metadata.json`),
      JSON.stringify(
        {
          imageFilename,
          testFilename: testInfo.titlePath[0],
          testName: testInfo.title,
        },
        null,
        2
      ),
      { encoding: "utf-8" }
    );
  }

  await page.emulateMedia({ colorScheme: "dark" });
  const screenshotDark = await takeScreenshotHelper(page, locator);
  expect(screenshotDark).not.toBeNull();
  if (WRITE_SNAPSHOT_IMAGE_FILES) {
    fs.writeFileSync(path.join(baseDir, "dark.png"), screenshotDark, { encoding: "base64" });
  } else {
    expect(screenshotDark).toMatchSnapshot(["dark", imageFilename]);
  }

  await page.emulateMedia({ colorScheme: "light" });
  const screenshotLight = await takeScreenshotHelper(page, locator);
  expect(screenshotLight).not.toBeNull();
  if (WRITE_SNAPSHOT_IMAGE_FILES) {
    fs.writeFileSync(path.join(baseDir, "light.png"), screenshotLight, { encoding: "base64" });
  } else {
    expect(screenshotLight).toMatchSnapshot(["light", imageFilename]);
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

export async function waitForSession(page: Page): Promise<void> {
  // When Replay is under heavy load, the backend may need to scale up AWS resources.
  // This should not cause e2e tests to fail, even though it takes longer than the default 15s timeout.
  // Relaxing only the initial check allows more time for the backend to scale up
  // without compromising the integrity of the tests overall.

  await waitFor(
    async () => {
      const value = await page.locator("body").getAttribute("data-initialized");
      expect(value).toBe("true");
    },
    {
      retryInterval: 1_000,
      timeout: 60_000,
    }
  );
}
