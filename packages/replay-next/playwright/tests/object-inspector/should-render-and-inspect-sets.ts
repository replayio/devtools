import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect sets", async ({ page }, testInfo) => {
  await filterByText(page, "set");

  await takeScreenshotOfMessages(page, testInfo, "rendered-sets");
  await inspectAndTakeScreenshotOf(page, testInfo, "simpleSet", "render-and-inspect-set");
});
