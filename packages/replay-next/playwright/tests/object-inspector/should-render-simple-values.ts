import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { takeScreenshotOfMessage } from "./shared";

beforeEach();

test("should render simple values", async ({ page }) => {
  await takeScreenshotOfMessage(page, "specialNull", "render-null");
  await takeScreenshotOfMessage(page, "specialUndefined", "render-undefined");

  await takeScreenshotOfMessage(page, "string", "render-string");

  await takeScreenshotOfMessage(page, "booleanFalse", "render-false");
  await takeScreenshotOfMessage(page, "booleanTrue", "render-true");

  await takeScreenshotOfMessage(page, "number", "render-number");
  await takeScreenshotOfMessage(page, "NaN", "render-nan");
  await takeScreenshotOfMessage(page, "infinity", "render-infinity");
  await takeScreenshotOfMessage(page, "bigInt", "render-bigInt");

  await takeScreenshotOfMessage(page, "symbol", "render-symbol");
});
