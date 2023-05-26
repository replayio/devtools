import { test } from "@playwright/test";

import { filterByText, locateMessage, seekToMessage } from "../utils/console";
import { delay, takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should be filterable", async ({ page }, testInfo) => {
  await setup(page, true);

  await filterByText(page, " an ");
  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, testInfo, consoleRoot, "filtered-single-result");

  await filterByText(page, " a ");
  await takeScreenshot(page, testInfo, consoleRoot, "filtered-three-results");

  await filterByText(page, "zzz");
  await takeScreenshot(page, testInfo, consoleRoot, "filtered-no-results");

  // Seeking to a message should not break the filter
  await filterByText(page, " a ");
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a trace"));
  await delay();
  await takeScreenshot(
    page,
    testInfo,
    consoleRoot,
    "filtered-three-results-after-seeking-to-last-message"
  );
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));
  await delay();
  await takeScreenshot(
    page,
    testInfo,
    consoleRoot,
    "filtered-three-results-after-seeking-to-first-message"
  );
});
