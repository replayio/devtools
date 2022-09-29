import { Locator, expect } from "@playwright/test";
import { waitFor } from "@playwright-testing-library/test";

import { openDevToolsTab, startTest, test } from "../helpers";
import { openConsolePanel, warpToMessage } from "../helpers/console-panel";
import { openPauseInformationPanel } from "../helpers/pause-information-panel";
import { Screen } from "../helpers/types";

interface StackingTestCase {
  id: string;
  position: { x: number; y: number };
  expectedRules: string[];
}

// This recording  has 4x4 sets of carefully positioned DOM nodes on screen
// Many of these boxes overlap in some way, with various CSS position rules in effect.
// The goal of this test is to verify that when we click at a specific coordinate,
// the backend correctly determines the right mouse target underneath the cursor,
// and we select the expected DOM node each time.
// This means we have very specific expectations that if I click coords X,Y, we
// will select a div with ".box1" or ".box2" or similar out of that group.

const testCases: StackingTestCase[] = [
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

  // TODO This lower-left set is finicky and not working right with this  test setup atm.

  // elements with multiple client rects:
  // all client rects are highlighted
  // This is a text node with multiple rects, so no rules apply
  // TODO: Checking things just by lack of rules risks false positives
  // {
  //   id: "r3c0a",
  //   position: { x: 60, y: 340 },
  //   expectedRules: [],
  // },
  // clicking inside the element's bounding client rect but outside all of its
  // client rects will not select the text node element.
  // Instead, this will select the square underneath it.
  // {
  //   id: "r3c0b",
  //   position: { x: 60, y: 320 },
  //   expectedRules: [".box1"],
  // },

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

async function ensureSidePanelClosed(screen: Screen) {
  // Clicks that aren't directly on an element can cause the "Comments" pane to open.
  // Ensure that it's closed by forcing the "Pause" pane to open instead...
  await openPauseInformationPanel(screen);
  // Then click it again to make sure the panel closes
  await screen.locator('[data-test-name="ToolbarButton-PauseInformation"]').click();
}

async function verifySelectedElementUnderCursor(
  screen: Screen,
  canvas: Locator,
  rulesContainer: Locator,
  scale: number,
  testCase: StackingTestCase
) {
  // deselect any previously selected DOM node by selecting `<body>`.
  // This ensures that the "Rules" tab is empty before every test case.
  await screen.queryByText(/Elements/).click();
  await screen.queryAllByText(/body/).first().click();

  // Click the "Select an Element from Preview" button
  await screen.locator("#command-button-pick").click();

  // Modify the original app coords by the canvas transform scale
  const position = {
    x: testCase.position.x * scale,
    y: testCase.position.y * scale,
  };

  await canvas.hover({
    position,
  });

  // Click the corresponding spot in the preview canvas
  await canvas.click({
    position,
    force: true,
  });

  // Now, grab the updated list entries from the "Rules" panel,
  // and parse out the name of each rule.
  await waitFor(async () => {
    const rulesEntries = rulesContainer.locator(".ruleview-rule");
    const numEntries = await rulesEntries.count();

    // Why does `Locator` not have a `.map()` function built in?
    const ruleSelectorPromises = Array.from({ length: numEntries }).map((_, i) => {
      // Dig the selector text like ".box2" out of the rule list item
      return rulesEntries.nth(i).locator(".ruleview-selectorcontainer").textContent();
    });

    const ruleSelectors = await Promise.all(ruleSelectorPromises);

    expect(ruleSelectors, `Incorrect rules found for test case: ${testCase.id}`).toEqual(
      testCase.expectedRules
    );
  });
}

test("Element highlighter selects the correct element when they overlap", async ({ screen }) => {
  await startTest(screen, "doc_stacking.html");
  await openDevToolsTab(screen);

  await warpToMessage(screen, "ExampleFinished");

  // Ensure that the left sidebar is collapsed
  ensureSidePanelClosed(screen);

  await openConsolePanel(screen);

  // Dock the console to the _left_ side, to make the video preview as big as possible
  await screen.queryByTestId("consoleDockButton").click();
  await screen.queryByText(/Dock to Left/).click();

  const canvas = screen.locator("canvas#graphics");
  const rulesContainer = screen.locator("#ruleview-container");

  // HACK Our preview canvas is scaled down depending on position and original app
  // screen size. We'll need to alter where we click on screen by the same scale,
  // in order to correctly click on the intended elements from original x/y coords.
  // Grab the `transform` style from the canvas node and parse out the scale factor.
  const canvasTransformString = await canvas.evaluate(node => {
    return node.style.transform;
  });
  // simpler to rewrite "scale(0.123)" by replacing than regexing right now
  const scaleString = canvasTransformString.replace("scale(", "").replace(")", "");

  const scale = Number(scaleString);

  for (let testCase of testCases) {
    // Really make sure the panel is closed
    ensureSidePanelClosed(screen);
    await verifySelectedElementUnderCursor(screen, canvas, rulesContainer, scale, testCase);
  }
});
