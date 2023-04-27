import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { takeScreenshot } from "../utils/general";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf, inspectGetter } from "./shared";

beforeEach();

test("should render getters and setters correctly", async ({ page }) => {
  await filterByText(page, "filter_objectWithGettersAndSetters");

  await inspectAndTakeScreenshotOf(
    page,
    "objectWithGettersAndSetters",
    "render-object-with-getters-and-setters"
  );

  await inspectGetter(page, "string");
  await inspectGetter(page, "null");
  await inspectGetter(page, "undefined");
  await inspectGetter(page, "object");
  await inspectGetter(page, "array");

  // Further inspect object and array
  const objectRow = await page
    .locator('[data-test-name="ExpandablePreview"]', { hasText: "objectGetter" })
    .first();
  await objectRow.click();
  await takeScreenshot(page, objectRow, "inspect-getter-nested-object");

  const arrayRow = await page
    .locator('[data-test-name="ExpandablePreview"]', { hasText: "arrayGetter" })
    .first();
  await arrayRow.click();
  await takeScreenshot(page, arrayRow, "inspect-getter-nested-array");
});
