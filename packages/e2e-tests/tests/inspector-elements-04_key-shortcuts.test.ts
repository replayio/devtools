import { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  getElementsListRow,
  openElementsPanel,
  typeKeyAndVerifySelectedElement,
  waitForElementsToLoad,
  waitForSelectedElementsRow,
} from "../helpers/elements-panel";
import { closeSidePanel } from "../helpers/pause-information-panel";
import { waitFor } from "../helpers/utils";
import test from "../testFixture";

test.use({ exampleKey: "doc_stacking.html" });
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

test("inspector-elements-04: Keyboard shortcuts should select the right DOM nodes", async ({
  pageWithMeta: { page, recordingId },
  exampleKey,
}) => {
  await startTest(page, recordingId);
  await openDevToolsTab(page);

  await warpToMessage(page, "ExampleFinished");

  // Ensure that the left sidebar is collapsed
  await closeSidePanel(page);

  await openElementsPanel(page);

  await waitForElementsToLoad(page);
  const bodyTag = await getElementsListRow(page, { text: "body", type: "opening" });
  await bodyTag.click();
  await waitForSelectedElementsRow(page, "body");

  // Basic up/down selects the next element in the tree and left arrow collapses it
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[0]);
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[0]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[1]);
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", bodyChildDomNodes[0]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[1]);
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[1]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[2]);
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[2]);
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", bodyChildDomNodes[3]);
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[3]);

  const div2ChildNode = '<div class="box1" style="z-index: -1;"';
  const div2Child = await getElementsListRow(page, { text: div2ChildNode });

  // Children should now be hidden
  await waitFor(async () => {
    expect(await div2Child.isVisible()).toBe(false);
  });

  // Right arrow expands the currently selected element
  await typeKeyAndVerifySelectedElement(page, "ArrowRight", bodyChildDomNodes[3]);

  // Children should now be visible
  await waitFor(async () => {
    expect(await div2Child.isVisible()).toBe(true);
  });

  // Pressing Down should select the first child, as it's the next row
  await typeKeyAndVerifySelectedElement(page, "ArrowDown", div2ChildNode);

  // Pressing Left jumps back to the parent
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[3]);
  // and Right while it's open goes to the child
  await typeKeyAndVerifySelectedElement(page, "ArrowRight", div2ChildNode);

  // Going back to the parent and Left again collapses the node
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", bodyChildDomNodes[3]);
  await typeKeyAndVerifySelectedElement(page, "ArrowLeft", bodyChildDomNodes[3]);

  // PageDown should jump down 10 rows
  await typeKeyAndVerifySelectedElement(page, "PageDown", bodyChildDomNodes[6]);

  // PageUp should jump up 10 rows
  await typeKeyAndVerifySelectedElement(page, "PageUp", bodyChildDomNodes[3]);

  // If we expand the first child, it should still jump 10 rows total
  await typeKeyAndVerifySelectedElement(page, "ArrowRight", bodyChildDomNodes[3]);
  await typeKeyAndVerifySelectedElement(
    page,
    "PageDown",
    '<div class="box2" style="position: static;"'
  );
  await typeKeyAndVerifySelectedElement(page, "PageUp", bodyChildDomNodes[3]);
});
