import { Page, TestInfo, test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { toggleProtocolMessages } from "../utils/console";
import { getTestUrl, takeScreenshot } from "../utils/general";

export async function inspect(page: Page, partialText: string) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  const keyValue = messageItem.locator("[data-test-name=Expandable]").first();
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });

  return keyValue;
}

export async function inspectAndTakeScreenshotOf(
  page: Page,
  testInfo: TestInfo,
  partialText: string,
  screenshotName: string
) {
  const keyValue = await inspect(page, partialText);
  await takeScreenshot(page, testInfo, keyValue, screenshotName);
}

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("console"));
  await toggleProtocolMessages(page, true);
});
