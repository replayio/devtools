import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render and inspect a Promise", async ({ page }, testInfo) => {
  await inspectAndTakeScreenshotOf(page, testInfo, "promise", "render-promise");
});
