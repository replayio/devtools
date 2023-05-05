import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect regular expressions", async ({ page }) => {
  await filterByText(page, "regex");

  await takeScreenshotOfMessages(page, "render-regular-expressions");
  await inspectAndTakeScreenshotOf(page, "regex", "render-and-inspect-regex");
});
