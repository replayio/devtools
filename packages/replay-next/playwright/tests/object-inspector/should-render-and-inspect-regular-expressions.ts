import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect regular expressions", async ({ page }, testInfo) => {
  await filterByText(page, "regex");

  await takeScreenshotOfMessages(page, testInfo, "render-regular-expressions");
  await inspectAndTakeScreenshotOf(page, testInfo, "regex", "render-and-inspect-regex");
});
