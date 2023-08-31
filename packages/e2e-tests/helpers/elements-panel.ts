import { Locator, Page, expect } from "@playwright/test";
import chalk from "chalk";

import { debugPrint, mapLocators, waitFor } from "./utils";

export async function activateInspectorTool(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-inspector"]').click();
}

export async function checkAppliedRules(page: Page, expected: any) {
  await waitFor(async () => {
    const appliedRules = await getAppliedRules(page);
    expect(appliedRules).toEqual(expected);
  });
}

export async function checkComputedStyle(
  page: Page,
  style: string,
  value: string,
  expectedSelectors: any = undefined
) {
  await waitFor(async () => {
    const computedStyle = await getComputedStyle(page, style);
    expect(computedStyle?.value).toEqual(value);
    if (expectedSelectors) {
      expect(computedStyle?.selectors).toEqual(expectedSelectors);
    }
  });
}

export function expandLonghands(page: Page) {
  return page.locator(".ruleview-expander").evaluateAll((expanders: HTMLElement[]) => {
    for (const expander of expanders) {
      if (expander.style.display !== "none" && !expander.classList.contains("open")) {
        expander.click();
      }
    }
  });
}

export async function expandPseudoElementRules(page: Page) {
  const header = page.locator("#rules-section-pseudoelement-header");
  if ((await header.count()) === 0) {
    return;
  }
  const classes = await header.locator(".theme-twisty").getAttribute("class");
  if (!classes?.includes("open")) {
    await header.click();
  }
}

export async function getAppliedRules(page: Page) {
  await openAppliedRulesTab(page);
  await expandPseudoElementRules(page);
  return await page.evaluate(() => {
    const rules = document.querySelectorAll<HTMLElement>(".ruleview-rule");
    return [...rules].map(rule => {
      const selector = rule
        .querySelector<HTMLElement>(".ruleview-selectorcontainer")!
        .innerText.trim();
      const source = rule.querySelector<HTMLElement>(".ruleview-rule-source")!.innerText.trim();
      const properties = [...rule.querySelectorAll<HTMLElement>(".ruleview-propertycontainer")].map(
        prop => {
          let longhandProps;
          if (prop.nextSibling) {
            longhandProps = [
              ...(prop.nextSibling as HTMLElement).querySelectorAll<HTMLElement>("li"),
            ].map(longhand => ({
              text: longhand.innerText,
              overridden: longhand.classList.contains("ruleview-overridden"),
            }));
          }
          const result: any = {
            text: prop.innerText.trim(),
            overridden: (prop.parentNode as HTMLElement).className.includes("overridden"),
          };
          if (longhandProps) {
            result.longhandProps = longhandProps;
          }
          return result;
        }
      );
      return { selector, source, properties };
    });
  });
}

// TODO [FE-626] Rewrite this helper to reduce complexity.
export async function getComputedStyle(page: Page, style: string) {
  await openComputedPropertiesTab(page);
  return await page.evaluate(style => {
    const names = document.querySelectorAll<HTMLElement>(".computed-property-name");
    const propertyName = [...names].find(n => n!.textContent!.includes(style));
    if (!propertyName) {
      return;
    }
    const container = propertyName.closest(".computed-property-view");
    if (!container) {
      return;
    }
    const propertyValue: HTMLElement | null = container.querySelector(".computed-property-value");
    const value = propertyValue?.textContent;

    let selectors: any[] = [];
    const propertyNodes = document.querySelectorAll<HTMLElement>(".computed-property-view");
    const propertyNode = [...propertyNodes].find(
      node => node!.querySelector(".computed-property-name")!.childNodes[0].textContent === style
    );
    if (propertyNode) {
      const expander: HTMLElement | null = propertyNode.querySelector(".computed-expander");
      if (!expander!.matches(".open")) {
        expander!.click();
      }
      const selectorNodes = (propertyNode.nextSibling as HTMLElement).querySelectorAll<HTMLElement>(
        ".rule-text"
      );
      selectors = [...selectorNodes].map(selectorNode => {
        const selector = (selectorNode.children[0] as HTMLElement).innerText;
        const value = (selectorNode.children[1] as HTMLElement).innerText;
        const label = (selectorNode.previousSibling as HTMLElement).innerText;
        const previousChild = (selectorNode.previousSibling as HTMLElement).children[0];
        const url = (previousChild as HTMLElement).title;
        const overridden = (selectorNode.parentNode as HTMLElement).classList.contains(
          "computed-overridden"
        );
        return { selector, value, label, url, overridden };
      });
    }

    return { value, selectors };
  }, style);
}

export async function getElementsPanelSelection(page: Page): Promise<Locator> {
  await debugPrint(page, `Getting Elements panel selection`, "getElementsPanelSelection");

  const elements = page.locator("#inspector-main-content");
  const selectedLine = elements.locator(".tag-line.selected");

  return selectedLine;
}

export async function getElementsRowWithText(
  page: Page,
  text: string,
  isSelected: boolean = false
): Promise<Locator> {
  await debugPrint(
    page,
    `Searching for Elements row containing "${chalk.bold(text)}"`,
    "getElementsRowWithText"
  );

  const escapedText = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return page.locator(
    `#markup-box ${isSelected ? ".selected" : ""}[role="treeitem"]:has-text("${escapedText}")`
  );
}

// This helper function uses the Elements inspector to click on a part of the preview Canvas.
// Rather than using hard-coded pixel numbers, the x and y positions passed in should be percentages (0-1)
// which will be converted to coordinates based on the size of the preview Canvas.
export async function inspectCanvasCoordinates(
  page: Page,
  xPercentage: number,
  yPercentage: number
): Promise<void> {
  if (xPercentage < 0 || xPercentage > 1 || yPercentage < 0 || yPercentage > 1) {
    throw Error(
      `Invalid coordinate percentages passed (${xPercentage}, ${yPercentage}); must be between 0-1.`
    );
  }

  await debugPrint(page, `Inspecting preview Canvas`, "inspectCanvasCoordinates");

  await activateInspectorTool(page);

  const pickerButton = page.locator('[title="Select an element in the video to inspect it"]')!;
  await pickerButton.click();

  const canvas = page.locator("#graphics");
  const height = await canvas.getAttribute("height");
  const width = await canvas.getAttribute("width");
  const x = xPercentage * (width as any as number);
  const y = yPercentage * (height as any as number);

  await debugPrint(
    page,
    `Clicking Canvas coordinates ${chalk.bold(x)}px (${Math.round(
      xPercentage * 100
    )}%), ${chalk.bold(y)}px (${Math.round(yPercentage * 100)}%)`,
    "inspectCanvasCoordinates"
  );

  canvas.click({ position: { x, y } });
}

export async function openAppliedRulesTab(page: Page) {
  const locator = page.locator("#ruleview-tab");
  await locator.waitFor();
  await locator.click();
}

export async function openComputedPropertiesTab(page: Page): Promise<void> {
  await openSelectedElementTab(page, "computedview-tab");
}

export async function openElementsPanel(page: Page): Promise<void> {
  await page.locator('[data-test-id="PanelButton-inspector"]').click();
}

async function openSelectedElementTab(page: Page, tabId: string): Promise<void> {
  await debugPrint(page, `Opening "${tabId} tab in Elements panel`, "openSelectedElementTab");

  let tabLocator = page.locator(`#${tabId}`);

  // When there are too many tabs to render visibly,
  // some are hidden within a dropdown menu.
  const dropDownLocator = page.locator(
    '[data-test-id="InspectorTabs"] [data-test-name="ResponsiveTabsDropDownButton"]'
  );
  if (await dropDownLocator.isVisible()) {
    await dropDownLocator.click();

    // Note we need to scope this query because tab ids are not unique :(
    const possibleTabLocator = page.locator(
      `[data-test-name="ResponsiveTabsDropDownItem"] #${tabId}`
    );
    if (await possibleTabLocator.isVisible()) {
      // If the specific tab we're looking for is in this dropdown,
      // click it instead of the (hidden) tab in the main toolbar.
      tabLocator = possibleTabLocator;
    }
  }

  await tabLocator.isVisible();
  await tabLocator.click({ force: true });
}

export async function searchElementsPanel(page: Page, searchText: string): Promise<void> {
  await debugPrint(
    page,
    `Searching Elements for text ${chalk.bold(`"${searchText}"`)}`,
    "searchElementsPanel"
  );

  await activateInspectorTool(page);

  const input = page.locator('[placeholder="Search HTML"]')!;
  await input.focus();
  await input.type(searchText);
  await input.press("Enter");
}

export async function selectElementsRowWithText(page: Page, text: string): Promise<void> {
  const elementsTab = page.locator(`button:has-text("Elements")`);
  await elementsTab.click();
  const node = await getElementsRowWithText(page, text);
  await node.waitFor();
  await node.click();
}

export async function selectNextElementsPanelSearchResult(page: Page): Promise<void> {
  const input = page.locator('[placeholder="Search HTML"]')!;
  await input.focus();
  await input.press("Enter");
}

export function getElementsTree(page: Page) {
  return page.locator(`#markup-box [role="tree"]`);
}

export async function waitForElementsToLoad(page: Page): Promise<void> {
  await debugPrint(page, "Waiting for elements to load", "waitForElementsToLoad");

  const elements = page.locator("#markup-box");
  await elements.waitFor();

  const tree = elements.locator('[role="tree"]');
  await tree.waitFor();
}

export async function toggleMarkupNode(page: Page, locator: Locator, open: boolean): Promise<void> {
  await debugPrint(
    page,
    `Toggling element node ${chalk.bold(open ? "open" : "closed")}`,
    "toggleMarkupNode"
  );

  const expander = locator.locator(".expander");
  await expander.waitFor();

  const isOpen = await expander.evaluate(node => node?.classList.contains("open"));
  if (isOpen !== open) {
    await expander.click();
  }
}

export async function waitForSelectedElementsRow(page: Page, text: string): Promise<void> {
  const locator = await getElementsRowWithText(page, text, true);
  await locator.waitFor();
}

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

  // TODO [FE-626] This lower-left set is finicky and not working right with this  test setup atm.

  // elements with multiple client rects:
  // all client rects are highlighted
  // This is a text node with multiple rects, so no rules apply
  // TODO [FE-626]: Checking things just by lack of rules risks false positives
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
  canvas: Locator,
  rulesContainer: Locator,
  testCase: StackingTestCase
) {
  await openElementsPanel(page);
  // deselect any previously selected DOM node by selecting `<body>`.
  // This ensures that the "Rules" tab is empty before every test case.
  await selectElementsRowWithText(page, "body");

  await openAppliedRulesTab(page);

  // HACK Our preview canvas is scaled down depending on position and original app
  // page size. We'll need to alter where we click on page by the same scale,
  // in order to correctly click on the intended elements from original x/y coords.
  // Grab the `transform` style from the canvas node and parse out the scale factor.
  const scale = await readCanvasTransformScale(canvas);

  // Click the "Select an Element from Preview" button
  await page.locator("#command-button-pick").click();

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

    const ruleSelectors = await mapLocators(rulesEntries, entryLocator =>
      entryLocator.locator(".ruleview-selectorcontainer").textContent()
    );

    expect(ruleSelectors, `Incorrect rules found for test case: ${testCase.id}`).toEqual(
      testCase.expectedRules
    );
  });
}

async function readCanvasTransformScale(canvas: Locator) {
  const canvasTransformString = await canvas.evaluate(node => {
    return node.style.transform;
  });
  // simpler to rewrite "scale(0.123)" by replacing than regexing right now
  const scaleString = canvasTransformString.replace("scale(", "").replace(")", "");

  const scale = Number(scaleString);
  return scale;
}
