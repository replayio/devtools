import { Page, test } from "@playwright/test";

import { getTestUrl, takeScreenshot } from "./utils/general";
import testSetup from "./utils/testSetup";

testSetup("b1849642-40a3-445c-96f8-4bcd2c35586e");

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("source-preview"));
});

function getSourcePreview(page: Page, partialText: string) {
  return page.locator("[data-test-name=SourcePreviewInspector]", { hasText: partialText });
}

test("should render headers for complex data correctly", async ({ page }) => {
  await takeScreenshot(page, getSourcePreview(page, "ƒ SomeFunction()"), "function");
  await takeScreenshot(page, getSourcePreview(page, "Array(3)"), "array");
  await takeScreenshot(page, getSourcePreview(page, `bar: "abc"`), "object");
  await takeScreenshot(page, getSourcePreview(page, "Map(2)"), "map");
  await takeScreenshot(page, getSourcePreview(page, "Set(2)"), "set");
  await takeScreenshot(page, getSourcePreview(page, "HTMLUListElementPrototype"), "html-element");
  await takeScreenshot(page, getSourcePreview(page, "#text"), "html-text");
  await takeScreenshot(page, getSourcePreview(page, "/abc/g"), "regexp");
});

test("should render primitive data correctly", async ({ page }) => {
  await takeScreenshot(page, getSourcePreview(page, "bigInt"), "bigint");
  await takeScreenshot(page, getSourcePreview(page, "string"), "string");
  await takeScreenshot(page, getSourcePreview(page, "number"), "number");
  await takeScreenshot(page, getSourcePreview(page, "boolean"), "boolean");
});
