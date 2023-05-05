import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect objects", async ({ page }) => {
  await filterByText(page, "filter_object");

  await takeScreenshotOfMessages(page, "rendered-objects");
  await inspectAndTakeScreenshotOf(page, "objectSimple", "render-and-inspect-object");
});
