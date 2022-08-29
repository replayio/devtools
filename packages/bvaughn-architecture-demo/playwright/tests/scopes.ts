import { test } from "@playwright/test";

import { getBaseURL, getURLFlags, takeScreenshot } from "./utils/general";
import { toggleExpandable } from "./utils/inspector";
import testSetup from "./utils/testSetup";

const URL = `${getBaseURL()}/tests/scopes?${getURLFlags()}`;

testSetup(async function regeneratorFunction({ page }) {
  await toggleExpandable(page, "globalValues");
  await toggleExpandable(page, "arrayWithNesting: (");
  await toggleExpandable(page, "objectWithNesting: {");
});

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(5000);

  await page.goto(URL);
});

test("should show/hide object and array previews when toggled", async ({ page }) => {
  await toggleExpandable(page, "globalValues");

  const inspectorRoot = page.locator('[data-test-id="InspectorRoot"]');
  await takeScreenshot(page, inspectorRoot, "root-properties-collapsed");

  await toggleExpandable(page, "arrayWithNesting: (");
  await toggleExpandable(page, "objectWithNesting: {");
  await takeScreenshot(page, inspectorRoot, "root-properties-expanded");
});
