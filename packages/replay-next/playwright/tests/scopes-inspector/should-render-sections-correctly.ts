import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { toggleExpandable } from "../utils/inspector";
import { beforeEach } from "./beforeEach";

beforeEach();

test("should render sections correctly", async ({ page }, testInfo) => {
  const block = page.locator("[data-test-name=ScopesInspector]");
  await takeScreenshot(page, testInfo, block, "block-collapsed");
  await toggleExpandable(page, { scope: block });
  await takeScreenshot(page, testInfo, block, "block-expanded");

  const window = page.locator("[data-test-name=InspectorRoot]", { hasText: "Window:" });
  await takeScreenshot(page, testInfo, window, "window-collapsed");
  await toggleExpandable(page, { scope: window });
  await takeScreenshot(page, testInfo, window, "window-expanded");
});
