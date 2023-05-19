import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { takeScreenshotHelper } from "./shared";

beforeEach();

test("should render primitive data correctly", async ({ page }, testInfo) => {
  await takeScreenshotHelper(page, testInfo, "bigInt", "bigint");
  await takeScreenshotHelper(page, testInfo, "string", "string");
  await takeScreenshotHelper(page, testInfo, "number", "number");
  await takeScreenshotHelper(page, testInfo, "boolean", "boolean");
});
