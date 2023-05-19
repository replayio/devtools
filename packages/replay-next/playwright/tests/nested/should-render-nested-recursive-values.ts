import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render nested, recursive values (as ellipses) without crashing", async ({
  page,
}, testInfo) => {
  const list = page.locator("[data-test-name=Messages]");

  await takeScreenshot(page, testInfo, list, "message-list");

  await inspectAndTakeScreenshotOf(page, testInfo, "{loopBack", "nested-resursive-object");
  await inspectAndTakeScreenshotOf(page, testInfo, "Array(3)", "nested-resursive-array");
  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "Function(recursive)",
    "nested-resursive-function"
  );
  await inspectAndTakeScreenshotOf(page, testInfo, "Map(3)", "nested-resursive-map");
  await inspectAndTakeScreenshotOf(page, testInfo, "Set(3)", "nested-resursive-set");
});
