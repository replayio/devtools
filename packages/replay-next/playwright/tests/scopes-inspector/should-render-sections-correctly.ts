import { test } from "@playwright/test";

import { takeScreenshot } from "../utils/general";
import { toggleExpandable } from "../utils/inspector";
import { beforeEach } from "./beforeEach";

beforeEach();

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
