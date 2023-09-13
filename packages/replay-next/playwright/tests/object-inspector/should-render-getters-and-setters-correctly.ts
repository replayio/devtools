import { test } from "@playwright/test";

import { toggleExpandable } from "replay-next/playwright/tests/utils/inspector";

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

  const objectRow = await toggleExpandable(page, {
    expanded: true,
    expandableLocator: page
      .locator(`[data-test-name="Expandable"] `, { hasText: "objectGetter" })
      .nth(1),
    partialText: "objectGetter",
  });
  await takeScreenshot(page, testInfo, objectRow.first(), "inspect-getter-nested-object");

  const arrayRow = await toggleExpandable(page, {
    expanded: true,
    expandableLocator: page
      .locator(`[data-test-name="Expandable"]`, { hasText: "arrayGetter" })
      .nth(1),
    partialText: "arrayGetter",
  });
  await takeScreenshot(page, testInfo, arrayRow.first(), "inspect-getter-nested-array");
});
