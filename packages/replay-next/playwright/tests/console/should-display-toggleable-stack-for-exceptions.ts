import { test } from "@playwright/test";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should display toggleable stack for exceptions", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "exceptions", true);

  const listItem = await locateMessage(page, "exception", "Another uncaught exception");
  await takeScreenshot(page, listItem, "uncaught-exception-stack-collapsed");

  const toggle = listItem.locator("[role=button]", { hasText: "Another uncaught exception" });
  await toggle.click();
  await takeScreenshot(page, listItem, "uncaught-exception-stack-expanded");
});
