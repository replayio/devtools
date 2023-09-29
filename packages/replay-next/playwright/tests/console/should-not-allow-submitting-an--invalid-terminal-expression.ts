import { expect, test } from "@playwright/test";

import { messageLocator } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should not allow submitting an invalid terminal expression", async ({ page }, testInfo) => {
  await setup(page);

  const invalidExpression = "+/global";

  await page.fill("[data-test-id=ConsoleTerminalInput]", invalidExpression);

  const input = page.locator("[data-test-id=ConsoleTerminalInput]");

  await takeScreenshot(page, testInfo, input, "terminal-input-disabled");

  await page.keyboard.press("Enter");

  const message = messageLocator(page, "terminal-expression", invalidExpression);
  await expect(await message.count()).toBe(0);
});
