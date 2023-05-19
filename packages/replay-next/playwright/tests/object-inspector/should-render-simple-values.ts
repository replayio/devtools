import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { takeScreenshotOfMessage } from "./shared";

beforeEach();

test("should render simple values", async ({ page }, testInfo) => {
  await takeScreenshotOfMessage(page, testInfo, "specialNull", "render-null");
  await takeScreenshotOfMessage(page, testInfo, "specialUndefined", "render-undefined");

  await takeScreenshotOfMessage(page, testInfo, "string", "render-string");

  await takeScreenshotOfMessage(page, testInfo, "booleanFalse", "render-false");
  await takeScreenshotOfMessage(page, testInfo, "booleanTrue", "render-true");

  await takeScreenshotOfMessage(page, testInfo, "number", "render-number");
  await takeScreenshotOfMessage(page, testInfo, "NaN", "render-nan");
  await takeScreenshotOfMessage(page, testInfo, "infinity", "render-infinity");
  await takeScreenshotOfMessage(page, testInfo, "bigInt", "render-bigInt");

  await takeScreenshotOfMessage(page, testInfo, "symbol", "render-symbol");
});
