import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { takeScreenshotHelper } from "./shared";

beforeEach();

test("should render headers for complex data correctly", async ({ page }) => {
  await takeScreenshotHelper(page, "ƒ SomeFunction()", "function");
  await takeScreenshotHelper(page, "Array(3)", "array");
  await takeScreenshotHelper(page, `bar: "abc"`, "object");
  await takeScreenshotHelper(page, "Map(2)", "map");
  await takeScreenshotHelper(page, "Set(2)", "set");
  await takeScreenshotHelper(page, "HTMLUListElementPrototype", "html-element");
  await takeScreenshotHelper(page, "#text", "html-text");
  await takeScreenshotHelper(page, "/abc/g", "regexp");
});
