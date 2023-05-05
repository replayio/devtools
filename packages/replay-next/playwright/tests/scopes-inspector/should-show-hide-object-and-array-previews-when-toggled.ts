import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { toggleExpandable } from "../utils/inspector";
import { beforeEach } from "./beforeEach";

beforeEach();

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
