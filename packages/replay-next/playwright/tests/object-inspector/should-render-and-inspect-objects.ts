import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect objects", async ({ page }, testInfo) => {
  await filterByText(page, "filter_object");

  await takeScreenshotOfMessages(page, testInfo, "rendered-objects");
  await inspectAndTakeScreenshotOf(page, testInfo, "objectSimple", "render-and-inspect-object");
});
