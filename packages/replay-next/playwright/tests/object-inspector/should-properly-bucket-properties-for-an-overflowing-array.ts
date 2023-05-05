import { test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should properly bucket properties for an overflowing array", async ({ page }) => {
  await filterByText(page, "overflowingArray");

  await inspectAndTakeScreenshotOf(page, "overflowingArray", "overflowing-array-expanded");

  await toggleExpandable(page, {
    partialText: "[0 … 99]",
    expanded: true,
  });
  await takeScreenshotOfMessages(page, "overflowing-array-first-bucket-expanded");

  await toggleExpandable(page, {
    partialText: "[0 … 99]",
    expanded: false,
  });
  await toggleExpandable(page, {
    partialText: "[100 … 105]",
    expanded: true,
  });
  await takeScreenshotOfMessages(page, "overflowing-array-second-bucket-expanded");
});
