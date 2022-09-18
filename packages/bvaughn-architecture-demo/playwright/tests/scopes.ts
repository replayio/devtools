import { test } from "@playwright/test";

import { getTestUrl, takeScreenshot } from "./utils/general";
import { toggleExpandable } from "./utils/inspector";
import testSetup from "./utils/testSetup";

testSetup("bd42974e-7751-4179-b114-53b3d2779778");

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(getTestUrl("scopes"));
});

test("should show/hide object and array previews when toggled", async ({ page }) => {
  await toggleExpandable(page, "globalValues");

  const inspectorRoot = page.locator('[data-test-id="InspectorRoot"]');
  await takeScreenshot(page, inspectorRoot, "root-properties-collapsed");

  await toggleExpandable(page, "arrayWithNesting: (");
  await toggleExpandable(page, "objectWithNesting: {");
  await takeScreenshot(page, inspectorRoot, "root-properties-expanded");
});
