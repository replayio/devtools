import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect functions", async ({ page }, testInfo) => {
  await filterByText(page, "function");

  await takeScreenshotOfMessages(page, testInfo, "render-functions");
  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "regularFunction",
    "render-and-inspect-function"
  );
});
