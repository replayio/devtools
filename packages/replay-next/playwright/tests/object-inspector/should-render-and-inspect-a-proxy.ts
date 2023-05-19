import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render and inspect a Proxy", async ({ page }, testInfo) => {
  await inspectAndTakeScreenshotOf(page, testInfo, "proxy", "render-proxy");
});
