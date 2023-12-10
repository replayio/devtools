import { startTest } from "../helpers";
import { delay, waitFor } from "../helpers/utils";
import test, { Page } from "../testFixtureCloneRecording";

async function waitForPanelSize(page: Page, expectedSize: number) {
  await waitFor(async () => {
    const flexStyle = await page.evaluate(() => {
      const element = document.querySelector('[data-panel-id="Panel-SidePanel"]');
      const style = window.getComputedStyle(element);
      return style.getPropertyValue("flex");
    });

    const actualSize = parseInt(flexStyle.split(" ")[0]);
    if (actualSize !== expectedSize) {
      throw `Expected panel size to be ${expectedSize} but was ${actualSize}`;
    }
  });
}

test.use({ exampleKey: "doc_rr_basic.html" });

test("resizable-panels-01: Left side Toolbar should be collapsible", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);

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
