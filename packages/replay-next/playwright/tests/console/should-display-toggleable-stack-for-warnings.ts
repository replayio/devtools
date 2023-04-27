import { test } from "@playwright/test";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should display toggleable stack for warnings", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "warnings", true);

  const listItem = await locateMessage(page, "console-warning", "This is a warning");
  await takeScreenshot(page, listItem, "warning-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "This is a warning" });
  await toggle.click();
  await takeScreenshot(page, listItem, "warning-stack-expanded");
});
