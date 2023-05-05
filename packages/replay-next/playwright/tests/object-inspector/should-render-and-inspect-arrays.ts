import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect arrays", async ({ page }) => {
  await filterByText(page, "array");

  await takeScreenshotOfMessages(page, "render-arrays");
  await inspectAndTakeScreenshotOf(page, "arrayLength", "render-and-inspect-array");
  await inspectAndTakeScreenshotOf(page, "bigUint64Array", "render-and-inspect-big-uint-64-array");
});
