import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect arrays", async ({ page }, testInfo) => {
  await filterByText(page, "array");

  await takeScreenshotOfMessages(page, testInfo, "render-arrays");
  await inspectAndTakeScreenshotOf(page, testInfo, "arrayLength", "render-and-inspect-array");
  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "bigUint64Array",
    "render-and-inspect-big-uint-64-array"
  );
});
