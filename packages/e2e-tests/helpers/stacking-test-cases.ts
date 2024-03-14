import { Locator, Page, expect } from "@playwright/test";

import {
  activateInspectorTool,
  openAppliedRulesTab,
  openElementsPanel,
  selectRootElementsRow,
} from "./elements-panel";
import { getGraphicsElementScale } from "./screenshot";
import { debugPrint, waitFor } from "./utils";

// `doc_stacking.html` data and utils

export interface StackingTestCase {
  id: string;
  position: { x: number; y: number };
  expectedRules: string[];
}

// This recording  has 4x4 sets of carefully positioned DOM nodes on page
// Many of these boxes overlap in some way, with various CSS position rules in effect.
// The goal of this test is to verify that when we click at a specific coordinate,
// the backend correctly determines the right mouse target underneath the cursor,
// and we select the expected DOM node each time.
// This means we have very specific expectations that if I click coords X,Y, we
// will select a div with ".box1" or ".box2" or similar out of that group.

export const stackingTestCases: StackingTestCase[] = [
  // elements are stacked in the order in which they appear in the DOM (from back to front)
  {
    id: "r0c0",
    position: { x: 40, y: 40 },
    expectedRules: [".box2"],
  },
  // positioned elements are in front of unpositioned ones
  {
    id: "r0c1",
    position: { x: 140, y: 40 },
    expectedRules: [".box1"],
  },
  // parent elements are in front of children with a negative z-index
  {
    id: "r0c2",
    position: { x: 240, y: 40 },
    expectedRules: ["element", "body > div"],
  },
  // elements with a higher z-index are in front of those with a lower one
  {
    id: "r0c3",
    position: { x: 340, y: 40 },
    expectedRules: ["element", ".box1"],
  },
  // floating elements are in front of unpositioned elements
  {
    id: "r1c0",
    position: { x: 40, y: 130 },
    expectedRules: ["element", ".box1"],
  },
  // elements with visibility: hidden are ignored
  {
    id: "r1c1",
    position: { x: 140, y: 140 },
    expectedRules: [".box1"],
  },
  // elements with pointer-events: none are ignored
  {
    id: "r1c2",
    position: { x: 240, y: 140 },
    expectedRules: [".box1"],
  },
  // the z-index is ignored for unpositioned elements
  {
    id: "r1c3",
    position: { x: 340, y: 140 },
    expectedRules: [".box2"],
  },

  // the z-index is _not_ ignored for unpositioned elements if they are flex items
  {
    id: "r2c0",
    position: { x: 40, y: 240 },
    expectedRules: ["element", ".box1"],
  },
  // the z-index is _not_ ignored for unpositioned elements if they are grid items
  {
    id: "r2c1",
    position: { x: 140, y: 240 },
    expectedRules: ["element", ".box1"],
  },
  // positioned elements without z-index don't create a stacking context
  {
    id: "r2c2",
    position: { x: 240, y: 240 },
    expectedRules: ["element", ".box1"],
  },
  // children of positioned elements are in front of children of unpositioned ones
  {
    id: "r2c3",
    position: { x: 240, y: 240 },
    expectedRules: ["element", ".box1"],
  },

  // The last row has 4 sets of boxes, but some additional checks

  // elements with multiple client rects:
  // all client rects are highlighted
  // This is a text node with multiple rects, so no rules apply
  // TODO [FE-626]: Checking things just by lack of rules risks false positives
  {
    id: "r3c0a",
    position: { x: 60, y: 340 },
    expectedRules: [],
  },
  // TODO [FE-626] This lower-left set is finicky and not working right with this  test setup atm.
  // clicking inside the element's bounding client rect but outside all of its
  // client rects will not select the text node element.
  // Instead, this will select the square underneath it.
  // {
  //   id: "r3c0b",
  //   position: { x: 60, y: 320 },
  //   expectedRules: [".box1"],
  // },

  // TODO [FE-626]:
  // unpositioned children of elements with overflow will be clipped
  {
    id: "r3c1",
    position: { x: 140, y: 340 },
    expectedRules: ["element", "body > div"],
  },
  // absolutely positioned elements are _not_ clipped by their unpositioned parent
  {
    id: "r3c2",
    position: { x: 240, y: 340 },
    expectedRules: [".box1"],
  },
  // absolutely positioned elements _are_ clipped by their relatively positioned parent
  {
    id: "r3c3",
    position: { x: 340, y: 340 },
    expectedRules: ["element", "body > div"],
  },
];

export async function verifyStackingTestCaseSelectedElementUnderCursor(
  page: Page,
  graphics: Locator,
  rulesContainer: Locator,
  testCase: StackingTestCase
) {
  await openElementsPanel(page);

  // deselect any previously selected DOM node by selecting the root HTML or DOCTYPE row.
  // This ensures that the "Rules" tab is empty before every test case.
  await selectRootElementsRow(page);

  await openAppliedRulesTab(page);

  // HACK Our preview canvas is scaled down depending on position and original app
  // page size. We'll need to alter where we click on page by the same scale,
  // in order to correctly click on the intended elements from original x/y coords.
  // Grab the `transform` style from the canvas node and parse out the scale factor.
  const scale = await getGraphicsElementScale(page);

  // Click the "Select an Element from Preview" button
  await activateInspectorTool(page);

  // Modify the original app coords by the canvas transform scale
  const position = {
    x: testCase.position.x * scale,
    y: testCase.position.y * scale,
  };

  await graphics.hover({
    position,
  });

  debugPrint(
    page,
    `Clicking at: ${position.x}, ${position.y} (original: ${testCase.position.x}, ${testCase.position.y})`
  );

  // Click the corresponding spot in the preview canvas
  await graphics.click({
    position,
    force: true,
  });

  // Now, grab the updated list entries from the "Rules" panel,
  // and parse out the name of each rule.
  await waitFor(async () => {
    const ruleSelectors = rulesContainer.locator('[data-test-name="RuleListItem-RuleState"]');
    const count = await ruleSelectors.count();
    expect(count).toEqual(testCase.expectedRules.length);

    for (let index = 0; index < count; index++) {
      const ruleSelector = ruleSelectors.nth(index);
      const textContent = await ruleSelector.textContent();

      expect(textContent?.startsWith(testCase.expectedRules[index])).toBe(true);
    }
  });
}
