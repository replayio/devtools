import { test } from "@playwright/test";

import { getTestUrl, takeScreenshot } from "./utils/general";
import { toggleExpandable } from "./utils/inspector";
import testSetup from "./utils/testSetup";

testSetup("b1849642-40a3-445c-96f8-4bcd2c35586e");

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("scopes-inspector"));
});

test("should render sections correctly", async ({ page }) => {
  const block = page.locator("[data-test-name=ScopesInspector]");
  await takeScreenshot(page, block, "block-collapsed");
  await toggleExpandable(page, { scope: block });
  await takeScreenshot(page, block, "block-expanded");

  const window = page.locator("[data-test-name=InspectorRoot]", { hasText: "Window:" });
  await takeScreenshot(page, window, "window-collapsed");
  await toggleExpandable(page, { scope: window });
  await takeScreenshot(page, window, "window-expanded");
});

test("should show/hide object and array previews when toggled", async ({ page }) => {
  const block = page.locator("[data-test-name=ScopesInspector]");
  await toggleExpandable(page, { scope: block });

  const array = block.locator("[data-test-name=InspectorRoot]", { hasText: "someArray" });
  const object = block.locator("[data-test-name=InspectorRoot]", { hasText: "someObject" });

  await takeScreenshot(page, array, "array-properties-collapsed");
  await takeScreenshot(page, object, "object-properties-collapsed");

  await toggleExpandable(page, { partialText: "someArray" });
  await toggleExpandable(page, { partialText: "someObject" });

  await takeScreenshot(page, array, "array-properties-expanded");
  await takeScreenshot(page, object, "object-properties-expanded");
});
