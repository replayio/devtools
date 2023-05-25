import { test } from "@playwright/test";

import {
  filterByText,
  locateMessage,
  searchByText,
  seekToMessage,
  showSearchInput,
} from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { setup } from "./shared";

beforeEach();

test("should be searchable", async ({ page }, testInfo) => {
  await setup(page, true);

  // Can't search without a Pause so let's ensure there is one.
  await seekToMessage(page, await locateMessage(page, "console-log", "This is a log"));

  await showSearchInput(page);

  await searchByText(page, " an ");

  const consoleRoot = page.locator("[data-test-id=ConsoleRoot]");
  await takeScreenshot(page, testInfo, consoleRoot, "searchable-single-result");

  await searchByText(page, " a ");
  await takeScreenshot(page, testInfo, consoleRoot, "searchable-result-1-of-3");

  await page.click("[data-test-id=ConsoleSearchGoToNextButton]");
  await page.click("[data-test-id=ConsoleSearchGoToNextButton]");
  await takeScreenshot(page, testInfo, consoleRoot, "searchable-result-3-of-3");

  await page.click("[data-test-id=ConsoleSearchGoToPreviousButton]");
  await takeScreenshot(page, testInfo, consoleRoot, "searchable-result-2-of-3");

  // Changes to filters should also update search results
  await filterByText(page, "warning");

  const searchResultsLabel = page.locator("[data-test-id=SearchResultsLabel]");
  await takeScreenshot(
    page,
    testInfo,
    searchResultsLabel,
    "searchable-result-updated-after-filter"
  );
});
