import { openDevToolsTab, startTest } from "../helpers";
import { showUserOptionsDropdown } from "../helpers/layout";
import { debugPrint, delay, waitFor } from "../helpers/utils";
import test, { Page, expect } from "../testFixtureCloneRecording";

async function waitForPanelSize(page: Page, expectedSize: number) {
  await waitFor(async () => {
    const actualSize = await page.evaluate(() => {
      const element = document.querySelector('[data-panel-id="Panel-SidePanel"]');
      if (element === null) {
        return 0;
      } else {
        const style = window.getComputedStyle(element);
        const flexStyle = style.getPropertyValue("flex");
        return parseInt(flexStyle.split(" ")[0]);
      }
    });

    if (actualSize !== expectedSize) {
      throw `Expected panel size to be ${expectedSize} but was ${actualSize}`;
    }
  });
}

test.use({ exampleKey: "doc_rr_basic_chromium.html" });

test("resizable-panels-01: Left side Toolbar and Video should be collapsible", async ({
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

  // Video panel should be toggleable
  debugPrint(page, "Checking video panel");
  await openDevToolsTab(page);

  debugPrint(page, "Initial height should be greater than 0");
  const video = page.locator("#video");
  const getVideoHeight = async () => {
    const heightValue = await video.evaluate(e => e.clientHeight);
    return heightValue;
  };
  const initialHeight = await getVideoHeight();
  expect(initialHeight).toBeGreaterThan(0);

  await showUserOptionsDropdown(page);
  const toggleVideoButton = page.locator(`[data-test-id="ToggleVideoPlayerButton"]`);

  const initialVideoState = await toggleVideoButton.getAttribute("data-test-video-collapsed");
  expect(initialVideoState).toBe("expanded");

  debugPrint(page, "Height should be 0 when collapsed");
  await toggleVideoButton.click();
  const collapsedVideoState = await toggleVideoButton.getAttribute("data-test-video-collapsed");
  expect(collapsedVideoState).toBe("collapsed");

  const collapsedHeight = await getVideoHeight();
  expect(collapsedHeight).toBe(0);

  debugPrint(page, "Expanded height should be greater than 0");
  await toggleVideoButton.click();
  const expandedVideoState = await toggleVideoButton.getAttribute("data-test-video-collapsed");
  expect(expandedVideoState).toBe("expanded");

  const expandedHeight = await getVideoHeight();
  expect(expandedHeight).toBeGreaterThan(0);
});
