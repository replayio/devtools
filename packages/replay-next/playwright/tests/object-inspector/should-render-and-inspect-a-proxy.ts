import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render and inspect a Proxy", async ({ page }) => {
  await inspectAndTakeScreenshotOf(page, "proxy", "render-proxy");
});
