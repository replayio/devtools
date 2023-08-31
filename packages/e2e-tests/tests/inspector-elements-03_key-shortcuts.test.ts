import { Locator, Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  getElementsPanelSelection,
  getElementsTree,
  openAppliedRulesTab,
  openElementsPanel,
  selectElementsRowWithText,
  waitForElementsToLoad,
  waitForSelectedElementsRow,
} from "../helpers/elements-panel";
import { toggleToolboxLayout } from "../helpers/layout";
import { getBreakpointsAccordionPane } from "../helpers/pause-information-panel";
import { delay, mapLocators, waitFor } from "../helpers/utils";
import test from "../testFixtureCloneRecording";

test.use({ exampleKey: "doc_stacking.html" });

async function ensureSidePanelClosed(page: Page) {
  // Clicks that aren't directly on an element can cause the "Comments" pane to open.
  // Ensure that it's closed by forcing the "Pause" pane to open instead...
  const pane = getBreakpointsAccordionPane(page);
  const pauseButton = page.locator('[data-test-name="ToolbarButton-PauseInformation"]');
  await pauseButton.click();
  const isVisible = await pane.isVisible();
  if (isVisible) {
    await pauseButton.click();
  }
}

test("inspector-elements-03: Keyboard shortcuts should select the right DOM nodes", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, exampleKey, recordingId);
  await openDevToolsTab(page);

  await warpToMessage(page, "ExampleFinished");

  // Ensure that the left sidebar is collapsed
  await ensureSidePanelClosed(page);

  await openElementsPanel(page);

  await waitForElementsToLoad(page);
  await waitForSelectedElementsRow(page, "body");
  const bodyTag = await getElementsPanelSelection(page);
  console.log("Waiting for body children to load...");
  const elementsTree = getElementsTree(page);
  await waitFor(async () => {
    const loadingChildren = elementsTree.getByText("Loading");
    const numChildren = await loadingChildren.count();
    console.log("Num loading children: ", numChildren);
    expect(numChildren).toBe(0);
  });

  await bodyTag.click();
  console.log("Typing ArrowDown 1");
  await page.keyboard.press("ArrowDown");
  await waitForSelectedElementsRow(page, `<style`);
  console.log("Typing ArrowDown 1");
  await page.keyboard.press("ArrowDown");
  await waitForSelectedElementsRow(page, `<div style="left: 0px; top: 0px;"`);
});
