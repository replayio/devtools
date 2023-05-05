import { test } from "@playwright/test";

import { locateMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should evaluate terminal expressions without an execution point", async ({ page }) => {
  await setup(page);

  await page.fill("[data-test-id=ConsoleTerminalInput]", "someUndefinedVariable");
  await page.keyboard.press("Enter");

  const newListItem = await locateMessage(page, "terminal-expression");
  await takeScreenshot(page, newListItem, "global-terminal-expression-valid");
});
