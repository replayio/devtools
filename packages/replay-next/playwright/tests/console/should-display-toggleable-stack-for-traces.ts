import { test } from "@playwright/test";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should display toggleable stack for traces", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "logs", true);

  const listItem = await locateMessage(page, "console-log", "This is a trace");
  await takeScreenshot(page, listItem, "trace-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "This is a trace" });
  await toggle.click();
  await takeScreenshot(page, listItem, "trace-stack-expanded");
});
