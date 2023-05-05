import { test } from "@playwright/test";

import { locateMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should evaluate and render invalid terminal expressions", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "+/global");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "global-terminal-expression-invalid");
});
