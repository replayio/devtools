import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, inspectGetter } from "./shared";

beforeEach();

test("should render getters and setters correctly", async ({ page }, testInfo) => {
  await filterByText(page, "filter_objectWithGettersAndSetters");

  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "objectWithGettersAndSetters",
    "render-object-with-getters-and-setters"
  );

  await inspectGetter(page, testInfo, "string");
  await inspectGetter(page, testInfo, "null");
  await inspectGetter(page, testInfo, "undefined");
  await inspectGetter(page, testInfo, "object");
  await inspectGetter(page, testInfo, "array");

  // Further inspect object and array
  const objectRow = await page
    .locator('[data-test-name="ExpandablePreview"]', { hasText: "objectGetter" })
    .first();
  await objectRow.click();
  await takeScreenshot(page, testInfo, objectRow, "inspect-getter-nested-object");

  const arrayRow = await page
    .locator('[data-test-name="ExpandablePreview"]', { hasText: "arrayGetter" })
    .first();
  await arrayRow.click();
  await takeScreenshot(page, testInfo, arrayRow, "inspect-getter-nested-array");
});
