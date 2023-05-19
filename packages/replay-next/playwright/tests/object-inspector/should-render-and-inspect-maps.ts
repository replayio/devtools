import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render and inspect maps", async ({ page }, testInfo) => {
  await filterByText(page, "map");

  await inspectAndTakeScreenshotOf(page, testInfo, "emptyMap", "render-empty-map");
  await inspectAndTakeScreenshotOf(page, testInfo, "simpleMap", "render-and-inspect-map");
  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "mapWithFalsyKeys",
    "render-and-inspect-map-with-falsy-keys"
  );
  await inspectAndTakeScreenshotOf(
    page,
    testInfo,
    "mapWithComplexKeys",
    "render-and-inspect-map-with-complex-keys"
  );
});
