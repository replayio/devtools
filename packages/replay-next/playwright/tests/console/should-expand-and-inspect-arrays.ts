import { test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should expand and inspect arrays", async ({ page }, testInfo) => {
  await setup(page);
  await toggleProtocolMessage(page, "warnings", true);

  const listItem = await locateMessage(page, "console-warning", "This is a warning");
  await takeScreenshot(page, testInfo, listItem, "array-collapsed");

  const outer = listItem.locator("[data-test-name=Expandable]", { hasText: "This is a warning" });
  const keyValue = outer.locator("[data-test-name=Expandable]", { hasText: "(3) [" });
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });
  await takeScreenshot(page, testInfo, listItem, "array-expanded");
});
