import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { toggleExpandable } from "../utils/inspector";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should show/hide object and array previews when toggled", async ({ page }, testInfo) => {
  const block = page.locator("[data-test-name=ScopesInspector]");
  await toggleExpandable(page, { scope: block });

  const array = block.locator("[data-test-name=InspectorRoot]", { hasText: "someArray" });
  const object = block.locator("[data-test-name=InspectorRoot]", { hasText: "someObject" });

  await takeScreenshot(page, testInfo, array, "array-properties-collapsed");
  await takeScreenshot(page, testInfo, object, "object-properties-collapsed");

  await toggleExpandable(page, { partialText: "someArray" });
  await toggleExpandable(page, { partialText: "someObject" });

  await takeScreenshot(page, testInfo, array, "array-properties-expanded");
  await takeScreenshot(page, testInfo, object, "object-properties-expanded");
});
