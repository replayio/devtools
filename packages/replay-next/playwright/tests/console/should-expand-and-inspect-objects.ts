import { test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should expand and inspect objects", async ({ page }) => {
  await setup(page);
  await toggleProtocolMessage(page, "errors", true);

  const listItem = await locateMessage(page, "console-error", "This is an error");
  await takeScreenshot(page, listItem, "object-collapsed");

  const outer = listItem.locator("[data-test-name=Expandable]", { hasText: "This is an error" });
  const keyValue = outer.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: keyValue,
  });
  await takeScreenshot(page, listItem, "object-expanded");

  const nestedKeyValue = keyValue.locator("[data-test-name=Expandable]", { hasText: "foo" });
  await toggleExpandable(page, {
    expanded: true,
    expandableLocator: nestedKeyValue,
  });
  await takeScreenshot(page, listItem, "nested-object-expanded");
});
