import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { takeScreenshotHelper } from "./shared";

beforeEach();

test("should render primitive data correctly", async ({ page }) => {
  await takeScreenshotHelper(page, "bigInt", "bigint");
  await takeScreenshotHelper(page, "string", "string");
  await takeScreenshotHelper(page, "number", "number");
  await takeScreenshotHelper(page, "boolean", "boolean");
});
