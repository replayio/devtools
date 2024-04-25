import { expect } from "@playwright/test";

import { openDevToolsTab, startTest } from "../helpers";
import { warpToMessage } from "../helpers/console-panel";
import {
  getElementsList,
  getElementsListRow,
  openElementsPanel,
  searchElementsPanel,
  typeKeyAndVerifySelectedElement,
  waitForElementsToLoad,
  waitForSelectedElementsRow,
} from "../helpers/elements-panel";
import { closeSidePanel } from "../helpers/pause-information-panel";
import {
  stackingTestCases,
  verifyStackingTestCaseSelectedElementUnderCursor,
} from "../helpers/stacking-test-cases";
import { debugPrint, waitFor } from "../helpers/utils";
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

test("inspector-elements-03: Nested node picker and selection behavior", async ({
  pageWithMeta: { page, recordingId, testScope },
  exampleKey,
}) => {
  await startTest(page, recordingId, testScope);
  await openDevToolsTab(page);

  await warpToMessage(page, "ExampleFinished");

  // Ensure that the left sidebar is collapsed
  await closeSidePanel(page);

  await openElementsPanel(page);

  await waitForElementsToLoad(page);

  debugPrint(page, "Waiting for body children to load...");
  const elementsTree = getElementsList(page);
  await waitFor(async () => {
    const loadingChildren = elementsTree.getByText("Loading");
    const numChildren = await loadingChildren.count();
    expect(numChildren).toBe(0);
  });

  const element = page.locator("#graphics");
  const rulesContainer = page.locator('[data-test-id="RulesPanel"]');

  const bodyTag = await getElementsListRow(page, { text: "body", type: "opening" });
  await bodyTag.click();

  const stackingCaseR3C2 = stackingTestCases.find(tc => tc.id === "r3c2")!;

  // This should select a `<div class="box1">`, 3 levels deep
  await verifyStackingTestCaseSelectedElementUnderCursor(
    page,
    element,
    rulesContainer,
    stackingCaseR3C2
  );
  let selectedRow = await waitForSelectedElementsRow(page, `<div class="box1"`);
  await selectedRow.click();
  await typeKeyAndVerifySelectedElement(
    page,
    "ArrowUp",
    `<div style="width: 40px; height: 20px; overflow: hidden;"`
  );
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", `<div style="left: 200px; top: 300px;"`);
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", "</div>");

  // Searching for a nested node should expand everything above it
  await searchElementsPanel(page, "Foo");

  selectedRow = await waitForSelectedElementsRow(page, `Foo Helloworld`);
  await selectedRow.click();

  await typeKeyAndVerifySelectedElement(page, "ArrowUp", `<span`);
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", `<div class="box1"`);
  await typeKeyAndVerifySelectedElement(page, "ArrowUp", bodyChildDomNodes[14]);
});
