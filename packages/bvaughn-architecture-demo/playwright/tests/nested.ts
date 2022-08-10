import { test, Page } from "@playwright/test";

import { toggleProtocolMessages } from "./utils/console";
import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/nested?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await page.goto(URL);

  await inspect(page, "Function(recursive)");
});

async function inspect(page: Page, partialText: string) {
  const messageItem = await page
    .locator("[data-test-name=Message]", { hasText: partialText })
    .first();

  const keyValue = messageItem.locator("[data-test-name=Expandable]").first();
  await keyValue.click();

  return keyValue;
}

async function inspectAndTakeScreenshotOf(page: Page, partialText: string, screenshotName: string) {
  const keyValue = await inspect(page, partialText);
  await takeScreenshot(page, keyValue, screenshotName);
}

test("should render nested, recursive values (as ellipses) without crashing", async ({ page }) => {
  await page.goto(URL);

  await toggleProtocolMessages(page, true);

  const list = page.locator("[data-test-name=Messages]");

  await takeScreenshot(page, list, "message-list");

  await inspectAndTakeScreenshotOf(page, "{loopBack", "nested-resursive-object");
  await inspectAndTakeScreenshotOf(page, "Array(3)", "nested-resursive-array");
  await inspectAndTakeScreenshotOf(page, "Function(recursive)", "nested-resursive-function");
  await inspectAndTakeScreenshotOf(page, "Map(3)", "nested-resursive-map");
  await inspectAndTakeScreenshotOf(page, "Set(3)", "nested-resursive-set");
});
