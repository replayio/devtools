import test, { Page, expect } from "@playwright/test";

import { startTest } from "../helpers";
import { delay, waitFor } from "../helpers/utils";

async function waitForPanelSize(page: Page, expectedSize: number) {
  const sidePanel = page.locator('[data-panel-id="Panel-SidePanel"]');
  await waitFor(async () => {
    const actualSize = parseInt((await sidePanel.getAttribute("data-panel-size")) || "");
    if (actualSize !== expectedSize) {
      throw `Expected panel size to be ${expectedSize} but was ${actualSize}`;
    }
  });
}

test("resizable-panels-01: Left side Toolbar should be collapsible", async ({ page }) => {
  await startTest(page, "doc_rr_basic.html");

  const button = page.locator('[data-test-name="ToolbarButton-ExpandSidePanel"]');
  const resizeHandle = page.locator('[data-panel-resize-handle-id="PanelResizeHandle-SidePanel"]');
  await resizeHandle.waitFor();

  // Collapse panel via the Window Splitter API
  await resizeHandle.focus();
  await page.keyboard.press("Home");
  await waitForPanelSize(page, 0);

  await delay(1_000); // Give the panel coordinates time to save

  // Reload page and panel should still be collapsed
  await page.reload();
  await waitForPanelSize(page, 0);

  // Expand panel
  await button.click();
  await waitForPanelSize(page, 15);

  await delay(1_000); // Give the panel coordinates time to save

  // Reload page and panel should still be expanded
  await page.reload();
  await waitForPanelSize(page, 15);

  // Collapse panel via the side toggle
  await button.click();
  await waitForPanelSize(page, 0);
});
