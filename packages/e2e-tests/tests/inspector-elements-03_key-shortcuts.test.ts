import { Locator, Page, expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import {
  getElementsPanelSelection,
  getElementsRowWithText,
  getElementsTree,
  openAppliedRulesTab,
  openElementsPanel,
  selectElementsRowWithText,
  waitForElementsToLoad,
  waitForSelectedElementsRow,
} from "../helpers/elements-panel";
import { toggleToolboxLayout } from "../helpers/layout";
import { getBreakpointsAccordionPane } from "../helpers/pause-information-panel";
import { debugPrint, delay, mapLocators, waitFor } from "../helpers/utils";
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

// ref: `doc_stacking.html`
// note the lack of a `>` on each tag string, due to how
// the elements tree constructs the text for each node
const bodyChildDomNodes = [
  `<style`,
  `<div style="left: 0px; top: 0px;"`,
  `<div style="left: 100px; top: 0px;"`,
  `<div style="left: 200px; top: 0px;"`,
  `<div style="left: 300px; top: 0px;"`,
  `<div style="left: 0px; top: 100px;"`,
  `<div style="left: 100px; top: 100px;"`,
  `<div style="left: 200px; top: 100px;"`,
  `<div style="left: 300px; top: 100px;"`,
  `<div style="left: 0px; top: 200px; display: flex;"`,
  `<div style="left: 100px; top: 200px; display: grid;"`,
  `<div style="left: 200px; top: 200px;"`,
  `<div style="left: 200px; top: 200px;"`,
  `<div style="left: 300px; top: 200px;"`,
  `<div style="left: 0px; top: 300px;"`,
  `<div style="left: 100px; top: 300px;"`,
  `<div style="left: 200px; top: 300px;"`,
  `<div style="left: 300px; top: 300px;"`,
];

const div0ChildDomNodes = [`<div class="box1"`, `<div class="box2"`];

async function typeKeyAndVerifySelectedElement(page: Page, key: string, expectedElement: string) {
  debugPrint(page, `Typing ${key}...`);
  await page.keyboard.press(key);
  await waitForSelectedElementsRow(page, expectedElement);
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
  debugPrint(page, "Waiting for body children to load...");
  const elementsTree = getElementsTree(page);
  await waitFor(async () => {
    const loadingChildren = elementsTree.getByText("Loading");
    const numChildren = await loadingChildren.count();
    expect(numChildren).toBe(0);
  });

  await bodyTag.click();

  // Basic up/down selects the next element in the tree
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[0]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[1]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[2]);
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", bodyChildDomNodes[1]);

  const div0Box1 = await getElementsRowWithText(page, div0ChildDomNodes[0]);
  const div0Box2 = await getElementsRowWithText(page, div0ChildDomNodes[1]);

  expect(await div0Box1.isVisible()).toBe(false);

  // Right arrow expands the currently selected element
  await typeKeyAndVerifySelectedElement(page, "ArrowRight", bodyChildDomNodes[1]);

  // Children should now be visible
  await waitFor(async () => {
    expect(await div0Box1.isVisible()).toBe(true);
  });

  // Pressing Down should select the first child, as it's the next row
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", div0ChildDomNodes[0]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", div0ChildDomNodes[1]);

  // Pressing Left jumps back to the parent
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[1]);

  // Pressing Left again collapses the node
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[1]);
  await waitFor(async () => {
    expect(await div0Box1.isVisible()).toBe(false);
  });

  // PageDown should jump down 10 rows
  await typeKeyAndVerifySelectedElement(page, "PageDown", bodyChildDomNodes[11]);

  // PageUp should jump up 10 rows
  await typeKeyAndVerifySelectedElement(page, "PageUp", bodyChildDomNodes[1]);

  // If we expand the first child, it should still jump 10 rows total
  await typeKeyAndVerifySelectedElement(page, "ArrowRight", bodyChildDomNodes[1]);
  await typeKeyAndVerifySelectedElement(page, "PageDown", bodyChildDomNodes[9]);
  await typeKeyAndVerifySelectedElement(page, "PageUp", bodyChildDomNodes[1]);
});
