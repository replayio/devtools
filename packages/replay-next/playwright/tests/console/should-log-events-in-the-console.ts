import { test } from "@playwright/test";

import { locateMessage, toggleProtocolMessage } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should log events in the console", async ({ page }) => {
  await setup(page);

  await page.click("[data-test-id=EventCategoryHeader-Mouse]");
  await page.click('[data-test-id="EventTypes-event.mouse.click"]');

  const listItem = await locateMessage(page, "event", "MouseEvent");
  await takeScreenshot(page, listItem, "event-types-mouse-click");

  await toggleProtocolMessage(page, "timestamps", true);
  await takeScreenshot(page, listItem, "event-types-mouse-click-with-timestamps");

  const keyValue = listItem.locator("[data-test-name=KeyValue]", { hasText: "MouseEvent" });
  await keyValue.click();
  await takeScreenshot(page, listItem, "event-types-mouse-click-with-timestamps-expanded");

  const filterToggles = page.locator("[data-test-id=ConsoleFilterToggles]");

  await page.fill("[data-test-id=EventTypeFilterInput]", "click");
  await takeScreenshot(page, filterToggles, "event-types-filtered-toggle-list");

  await page.fill("[data-test-id=EventTypeFilterInput]", "zzz");
  await takeScreenshot(page, filterToggles, "event-types-filtered-toggle-list-no-results");
});
