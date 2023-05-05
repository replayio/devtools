import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render nested, recursive values (as ellipses) without crashing", async ({ page }) => {
  const list = page.locator("[data-test-name=Messages]");

  await takeScreenshot(page, list, "message-list");

  await inspectAndTakeScreenshotOf(page, "{loopBack", "nested-resursive-object");
  await inspectAndTakeScreenshotOf(page, "Array(3)", "nested-resursive-array");
  await inspectAndTakeScreenshotOf(page, "Function(recursive)", "nested-resursive-function");
  await inspectAndTakeScreenshotOf(page, "Map(3)", "nested-resursive-map");
  await inspectAndTakeScreenshotOf(page, "Set(3)", "nested-resursive-set");
});
