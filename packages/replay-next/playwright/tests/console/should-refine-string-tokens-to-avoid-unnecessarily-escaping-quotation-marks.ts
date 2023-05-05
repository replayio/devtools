import { test } from "@playwright/test";

import { locateMessage } from "../utils/console";
import { stopHovering, takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should refine string tokens to avoid unnecessarily escaping quotation marks", async ({
  page,
}) => {
  await setup(page, false);

  await page.fill("[data-test-id=ConsoleTerminalInput]", `"a\\"b" + 123 + 'c\\'c' + true`);
  await page.keyboard.press("Enter"); // Submit expression

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "terminal-expression-with-refined-string-tokens");
});
