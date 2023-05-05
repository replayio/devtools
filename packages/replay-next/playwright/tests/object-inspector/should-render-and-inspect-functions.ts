import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, takeScreenshotOfMessages } from "./shared";

beforeEach();

test("should render and inspect functions", async ({ page }) => {
  await filterByText(page, "function");

  await takeScreenshotOfMessages(page, "render-functions");
  await inspectAndTakeScreenshotOf(page, "regularFunction", "render-and-inspect-function");
});
