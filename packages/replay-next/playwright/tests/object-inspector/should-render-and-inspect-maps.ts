import { test } from "@playwright/test";

import { filterByText } from "../utils/console";
import { beforeEach } from "./beforeEach";
import { inspectAndTakeScreenshotOf } from "./shared";

beforeEach();

test("should render and inspect maps", async ({ page }) => {
  await filterByText(page, "map");

  await inspectAndTakeScreenshotOf(page, "emptyMap", "render-empty-map");
  await inspectAndTakeScreenshotOf(page, "simpleMap", "render-and-inspect-map");
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithFalsyKeys",
    "render-and-inspect-map-with-falsy-keys"
  );
  await inspectAndTakeScreenshotOf(
    page,
    "mapWithComplexKeys",
    "render-and-inspect-map-with-complex-keys"
  );
});
