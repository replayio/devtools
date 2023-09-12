import { Page, TestInfo } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { takeScreenshot } from "../utils/general";

export async function inspectAndTakeScreenshotOf(
  page: Page,
  testInfo: TestInfo,
  partialText: string,
  screenshotName: string
) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  const keyValue = messageItem.locator("[data-test-name=Expandable]").first();
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });

  await takeScreenshot(page, testInfo, keyValue, screenshotName);
}

export async function inspectGetter(page: Page, testInfo: TestInfo, partialText: string) {
  const messageItems = await page.locator("[data-test-name=Message]", { hasText: partialText });

  const getter = await messageItems.locator('[data-test-name="GetterRenderer"]', {
    hasText: partialText,
  });
  await takeScreenshot(page, testInfo, getter, `${partialText}-getter-before-inspection`);
  const invokeGetterButton = getter.locator('[data-test-name="InvokeGetterButton"]');
  await invokeGetterButton.click();
  await getter.locator('[data-test-name="GetterValue"]').waitFor();
  await takeScreenshot(page, testInfo, getter, `${partialText}-getter-after-inspection`);
}

export async function takeScreenshotOfMessage(
  page: Page,
  testInfo: TestInfo,
  partialText: string,
  screenshotName: string
) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  await takeScreenshot(page, testInfo, messageItem, screenshotName);
}

export async function takeScreenshotOfMessages(
  page: Page,
  testInfo: TestInfo,
  screenshotName: string
) {
  const messageItem = await page.locator("[data-test-name=Messages]").first();

  await takeScreenshot(page, testInfo, messageItem, screenshotName);
}
