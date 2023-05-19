import { test } from "@playwright/test";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should display toggleable stack for errors", async ({ page }, testInfo) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error");
  await takeScreenshot(page, testInfo, listItem, "error-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "This is an error" });
  await toggle.click();
  await takeScreenshot(page, testInfo, listItem, "error-stack-expanded");
});
