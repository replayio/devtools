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

async function takeScreenshotHelper(page: Page, partialText: string, title: string) {
  const locator = getSourcePreview(page, partialText);
  await locator.scrollIntoViewIfNeeded();

  await takeScreenshot(page, locator, title);
}

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

test("should render primitive data correctly", async ({ page }) => {
  await takeScreenshotHelper(page, "bigInt", "bigint");
  await takeScreenshotHelper(page, "string", "string");
  await takeScreenshotHelper(page, "number", "number");
  await takeScreenshotHelper(page, "boolean", "boolean");
});
