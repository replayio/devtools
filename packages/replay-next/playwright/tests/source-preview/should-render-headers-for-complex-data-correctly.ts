import { test } from "@playwright/test";

import { beforeEach } from "./beforeEach";
import { takeScreenshotHelper } from "./shared";

beforeEach();

test("should render headers for complex data correctly", async ({ page }, testInfo) => {
  await takeScreenshotHelper(page, testInfo, "ƒ SomeFunction()", "function");
  await takeScreenshotHelper(page, testInfo, "Array(3)", "array");
  await takeScreenshotHelper(page, testInfo, `bar: "abc"`, "object");
  await takeScreenshotHelper(page, testInfo, "Map(2)", "map");
  await takeScreenshotHelper(page, testInfo, "Set(2)", "set");
  await takeScreenshotHelper(page, testInfo, "HTMLUListElementPrototype", "html-element");
  await takeScreenshotHelper(page, testInfo, "#text", "html-text");
  await takeScreenshotHelper(page, testInfo, "/abc/g", "regexp");
});
